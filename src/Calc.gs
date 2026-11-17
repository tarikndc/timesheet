/**
 * Calculation engine.
 * Leave for a month = manual leave entries + holidays (8 h each).
 * A holiday date counts once, as the holiday hours. Leave on that date is not added.
 * Adjusted = Allocated - (Total leave x Allocated / Total allocated)
 * Actual   = |Logged - Adjusted|, shown without direction
 * Flag when |Logged - Adjusted| is above the tolerance
 */

function toYmd(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, ss().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  }
  const s = String(v || '');
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, ss().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
}

function inMonth(v, monthNum, year) {
  const s = toYmd(v);
  if (!s) return false;
  return Number(s.slice(0, 4)) === Number(year) && Number(s.slice(5, 7)) === Number(monthNum);
}

function isWeekendYmd_(ymd) {
  const wd = new Date(ymd + 'T00:00:00').getDay();
  return wd === 5 || wd === 6;
}

/** Holidays for the month, keyed by date. Weekends are ignored. */
function holidaysForMonth_(mNum, y) {
  const map = {};
  readTable(TAB.HOL).forEach(h => {
    const ymd = toYmd(h.Date);
    if (!ymd || !inMonth(ymd, mNum, y) || isWeekendYmd_(ymd)) return;
    map[ymd] = { name: h.Name || 'Holiday', type: h.Type || '', hours: Number(h.Hours) || 8 };
  });
  return map;
}

/** Leave hours per date for the month, with holidays included. */
function leaveByDay_(empId, mNum, y) {
  const hols = holidaysForMonth_(mNum, y);
  const byDay = {};
  Object.keys(hols).forEach(ymd => {
    byDay[ymd] = { Holiday: hols[ymd].hours };
  });
  readTable(TAB.LEAVE).forEach(l => {
    if (l.EmployeeID !== empId || !inMonth(l.LeaveDate, mNum, y)) return;
    const ymd = toYmd(l.LeaveDate);
    if (hols[ymd]) return;   // the holiday already covers this day
    byDay[ymd] = byDay[ymd] || {};
    byDay[ymd][l.LeaveType] = round2_((byDay[ymd][l.LeaveType] || 0) + Number(l.Hours || 0));
  });
  return { byDay: byDay, holidays: hols };
}

function monthReport(employeeId, month, year) {
  const mNum = typeof month === 'number' ? month : monthIndex(month);
  const y = Number(year);
  const tolerance = Number(getSettings().VarianceToleranceHours);

  const allocs = readTable(TAB.ALLOC).filter(a =>
    a.EmployeeID === employeeId && Number(a.Year) === y && monthIndex(a.Month) === mNum
  );

  const lb = leaveByDay_(employeeId, mNum, y);
  let leaveHours = 0;
  Object.keys(lb.byDay).forEach(ymd => {
    Object.keys(lb.byDay[ymd]).forEach(t => { leaveHours += lb.byDay[ymd][t]; });
  });
  leaveHours = round2_(leaveHours);

  const timeEntries = readTable(TAB.TIME).filter(t =>
    t.EmployeeID === employeeId && t.Status !== 'Rejected' && inMonth(t.WorkDate, mNum, y)
  );

  const totalAlloc = allocs.reduce((s, a) => s + Number(a.AllocatedHours || 0), 0);

  const rows = allocs.map(a => {
    const allocated = Number(a.AllocatedHours || 0);
    const share = totalAlloc > 0 ? allocated / totalAlloc : 0;
    const leaveShare = leaveHours * share;
    const adjusted = allocated - leaveShare;
    const actual = timeEntries
      .filter(t => t.ProjectName === a.ProjectName)
      .reduce((s, t) => s + Number(t.Hours || 0), 0);
    const variance = actual - adjusted;
    return {
      project: a.ProjectName,
      allocated: allocated,
      leaveShare: leaveShare,
      adjusted: adjusted,
      actual: actual,
      variance: variance,
      flag: Math.abs(variance) > tolerance
    };
  });

  return {
    employeeId: employeeId,
    month: mNum,
    monthName: MONTHS[mNum - 1],
    year: y,
    totalAllocated: totalAlloc,
    totalLeave: leaveHours,
    tolerance: tolerance,
    rows: rows,
    flaggedCount: rows.filter(r => r.flag).length
  };
}
