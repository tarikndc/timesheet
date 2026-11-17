const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Other'];

function ymdOf_(d) {
  return d.getFullYear() + '-' + pad2_(d.getMonth() + 1) + '-' + pad2_(d.getDate());
}

/** Blocks leave changes once the month is submitted or approved. */
function assertEditable_(empId, month, year) {
  const st = latestApprovalStatus(empId, month, year);
  if (st === 'Submitted' || st === 'Approved') {
    throw new Error('This month is ' + st.toLowerCase() + '. Leave cannot be changed now. Ask your manager to return it first.');
  }
}

/** Leave rows for the month plus the holidays (holidays are read-only). */
function getMyLeave(month, year) {
  const me = currentUser();
  if (!me.employee) throw new Error('No employee record for this account.');
  const mNum = monthIndex(month);
  const y = Number(year);
  const empId = me.employee.EmployeeID;
  const hols = holidaysForMonth_(mNum, y);
  const out = [];

  readTable(TAB.LEAVE).forEach(l => {
    if (l.EmployeeID !== empId || !inMonth(l.LeaveDate, mNum, y)) return;
    const ymd = toYmd(l.LeaveDate);
    const covered = !!hols[ymd];
    out.push({
      id: l.EntryID,
      date: ymd,
      type: l.LeaveType,
      hours: covered ? 0 : Number(l.Hours),
      status: covered ? 'Not counted: holiday on this date' : l.Status,
      editable: true
    });
  });

  Object.keys(hols).forEach(ymd => {
    out.push({
      id: 'HOL-' + ymd,
      date: ymd,
      type: 'Holiday',
      hours: hols[ymd].hours,
      status: hols[ymd].name,
      editable: false
    });
  });

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Adds leave for a date range. Full day = 8 h, half day = 4 h. Friday and Saturday are skipped. */
function addLeaveRange(fromStr, toStr, type, hours) {
  const me = currentUser();
  if (!me.employee) throw new Error('No employee record for this account.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromStr) || !/^\d{4}-\d{2}-\d{2}$/.test(toStr)) throw new Error('Invalid date.');
  if (LEAVE_TYPES.indexOf(type) < 0) throw new Error('Invalid leave type.');
  const h = Number(hours);
  if (h !== 4 && h !== 8) throw new Error('Duration must be a full day (8 h) or a half day (4 h).');

  const start = new Date(fromStr + 'T00:00:00');
  const end = new Date(toStr + 'T00:00:00');
  if (end < start) throw new Error('End date is before the start date.');
  if ((end - start) / 86400000 > 31) throw new Error('Range is too long. Add up to 31 days at a time.');

  const empId = me.employee.EmployeeID;
  assertEditable_(empId, MONTHS[Number(fromStr.slice(5, 7)) - 1], Number(fromStr.slice(0, 4)));

  return withLock_(function () {
    const existing = {};
    readTable(TAB.LEAVE).forEach(l => {
      if (l.EmployeeID !== empId) return;
      const k = toYmd(l.LeaveDate);
      existing[k] = (existing[k] || 0) + Number(l.Hours || 0);
    });

    const holCache = {};
    const holidayOn = ymd => {
      const key = ymd.slice(0, 7);
      if (!holCache[key]) holCache[key] = holidaysForMonth_(Number(ymd.slice(5, 7)), Number(ymd.slice(0, 4)));
      return holCache[key][ymd];
    };

    const rows = [];
    const conflicts = [];
    let skipped = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ymd = ymdOf_(d);
      if (d.getDay() === 5 || d.getDay() === 6) { skipped++; continue; }
      if (holidayOn(ymd)) { conflicts.push(ymd + ' (holiday)'); continue; }
      const already = existing[ymd] || 0;
      if (already + h > MAX_LEAVE_PER_DAY) {
        conflicts.push(ymd + ' (' + already + ' h already)');
        continue;
      }
      rows.push([newId('LV'), empId, ymd, type, h, 'Submitted']);
    }

    if (conflicts.length) {
      throw new Error('Entry rejected. Leave cannot exceed ' + MAX_LEAVE_PER_DAY +
        ' h on one day, and holidays are already counted. Conflicts: ' + conflicts.join(', ') + '. Nothing was saved.');
    }

    if (rows.length) {
      const sh = ss().getSheetByName(TAB.LEAVE);
      const first = sh.getLastRow() + 1;
      sh.getRange(first, 3, rows.length, 1).setNumberFormat('@');
      sh.getRange(first, 1, rows.length, 6).setValues(rows);
    }
        if (rows.length) notifyLeave_(empId, fromStr, toStr, type, rows.length);
    return { added: rows.length, skipped: skipped };
  });
}

function deleteLeave(entryId) {
  const me = currentUser();
  if (!me.employee) throw new Error('No employee record for this account.');
  const empId = me.employee.EmployeeID;

  return withLock_(function () {
    const sh = ss().getSheetByName(TAB.LEAVE);
    const values = sh.getDataRange().getValues();
    for (let r = values.length - 1; r >= 1; r--) {
      if (values[r][0] === entryId && values[r][1] === empId) {
        const ymd = toYmd(values[r][2]);
        assertEditable_(empId, MONTHS[Number(ymd.slice(5, 7)) - 1], Number(ymd.slice(0, 4)));
        sh.deleteRow(r + 1);
        return { deleted: true };
      }
    }
    throw new Error('Leave entry not found.');
  });
}
