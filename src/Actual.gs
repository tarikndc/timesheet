const ACTUAL_TAG = 'WEB';
const ACTUAL_TOL = 0.005;
const LEAVE_ORDER = ['Annual', 'Sick', 'Casual', 'Other', 'Holiday'];

function leaveOrd_(t) {
  const i = LEAVE_ORDER.indexOf(t);
  return i < 0 ? 99 : i;
}

/** Hours allowed for project work on a day: 8 minus leave/holiday hours that day. */
function dayCapFromLeave_(leaveMap) {
  const used = Object.keys(leaveMap || {}).reduce((s, t) => s + (leaveMap[t] || 0), 0);
  return round2_(Math.max(0, MAX_WORK_PER_DAY - used));
}

/**
 * Targets per project (2 dp). The largest project absorbs rounding,
 * so the project targets always add up exactly to the month total.
 */
function targetsFor_(report) {
  const rows = report.rows;
  const total = round2_(rows.reduce((s, r) => s + r.adjusted, 0));
  const targets = {};
  let biggest = null;
  rows.forEach(r => { if (!biggest || r.allocated > biggest.allocated) biggest = r; });
  let sumOthers = 0;
  rows.forEach(r => {
    if (r === biggest) return;
    targets[r.project] = round2_(r.adjusted);
    sumOthers = round2_(sumOthers + targets[r.project]);
  });
  if (biggest) targets[biggest.project] = round2_(total - sumOthers);
  return { targets: targets, total: total };
}

function buildMonthDays_(mNum, y) {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [];
  const n = new Date(y, mNum, 0).getDate();
  for (let d = 1; d <= n; d++) {
    const ymd = y + '-' + pad2_(mNum) + '-' + pad2_(d);
    const wd = new Date(y, mNum - 1, d).getDay();
    days.push({
      ymd: ymd,
      day: d,
      weekday: names[wd],
      weekend: wd === 5 || wd === 6,
      hours: {},
      leave: {},
      cap: MAX_WORK_PER_DAY
    });
  }
  return days;
}

function getActualGrid(month, year) {
  const me = currentUser();
  if (!me.employee) throw new Error('No employee record for this account.');
  const mNum = monthIndex(month);
  const y = Number(year);
  const empId = me.employee.EmployeeID;

  const report = monthReport(empId, month, y);
  const tt = targetsFor_(report);
  const targets = tt.targets;
  const totalTarget = tt.total;

  const projects = [];
  report.rows.forEach(r => {
    if (projects.indexOf(r.project) < 0) projects.push(r.project);
  });

  const days = buildMonthDays_(mNum, y);
  const byYmd = {};
  days.forEach(d => (byYmd[d.ymd] = d));

  readTable(TAB.TIME).forEach(t => {
    if (t.EmployeeID !== empId || t.EmailReference !== ACTUAL_TAG || !inMonth(t.WorkDate, mNum, y)) return;
    const d = byYmd[toYmd(t.WorkDate)];
    if (!d) return;
    d.hours[t.ProjectName] = round2_((d.hours[t.ProjectName] || 0) + Number(t.Hours || 0));
    if (projects.indexOf(t.ProjectName) < 0) projects.push(t.ProjectName);
  });

  const lb = leaveByDay_(empId, mNum, y);
  const leaveTypes = [];
  Object.keys(lb.byDay).forEach(ymd => {
    if (!byYmd[ymd]) return;
    byYmd[ymd].leave = lb.byDay[ymd];
    Object.keys(lb.byDay[ymd]).forEach(t => {
      if (leaveTypes.indexOf(t) < 0) leaveTypes.push(t);
    });
  });
  days.forEach(d => {
    d.cap = d.weekend ? 0 : dayCapFromLeave_(d.leave);
  });
  leaveTypes.sort((a, b) => leaveOrd_(a) - leaveOrd_(b));

  return {
    projects: projects,
    leaveTypes: leaveTypes,
    days: days,
    targets: targets,
    totalTarget: totalTarget,
    status: latestApprovalStatus(empId, month, y)
  };
}

function saveActualGrid(month, year, grid) {
  const me = currentUser();
  if (!me.employee) throw new Error('No employee record for this account.');
  const mNum = monthIndex(month);
  const y = Number(year);
  const empId = me.employee.EmployeeID;
  const prefix = y + '-' + pad2_(mNum);

  const st = latestApprovalStatus(empId, month, y);
  if (st === 'Submitted' || st === 'Approved') {
    throw new Error('This month is ' + st.toLowerCase() + '. Hours are locked.');
  }

  const lbByDay = leaveByDay_(empId, mNum, y).byDay;

  const report = monthReport(empId, month, y);
  const tt = targetsFor_(report);
  const targets = tt.targets;
  const totalTarget = tt.total;

  const validProjects = new Set(readTable(TAB.PROJ).filter(p => isTrue(p.Active)).map(p => p.ProjectName));
  const now = new Date();
  const rows = [];
  const weekendErr = [];
  const fullDayErr = [];
  const dayErrors = [];
  const projTotals = {};
  let grand = 0;

  Object.keys(grid || {}).forEach(ymd => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd) || ymd.slice(0, 7) !== prefix) {
      throw new Error('Date outside the selected month: ' + ymd);
    }
    const hasHours = Object.keys(grid[ymd]).some(p => Number(grid[ymd][p]) > 0);
    if (!hasHours) return;
    if (isWeekendYmd_(ymd)) { weekendErr.push(ymd); return; }

    const cap = dayCapFromLeave_(lbByDay[ymd]);
    if (cap <= 0) { fullDayErr.push(ymd); return; }

    let dayTotal = 0;
    Object.keys(grid[ymd]).forEach(p => {
      const h = Number(grid[ymd][p]) || 0;
      if (h <= 0) return;
      if (!validProjects.has(p)) throw new Error('Inactive or unknown project: ' + p);
      dayTotal = round2_(dayTotal + h);
      projTotals[p] = round2_((projTotals[p] || 0) + h);
      grand = round2_(grand + h);
      rows.push([newId('TE'), empId, ymd, p, round2_(h), ACTUAL_TAG, 'Submitted', now]);
    });
    if (dayTotal > cap + ACTUAL_TOL) {
      dayErrors.push(ymd + ' (' + round2_(dayTotal) + ' h, allowed ' + cap + ' h)');
    }
  });

  if (weekendErr.length) {
    throw new Error('Not saved. Friday and Saturday cannot have hours: ' + weekendErr.join(', '));
  }
  if (fullDayErr.length) {
    throw new Error('Not saved. Full-day leave or a holiday is recorded on: ' + fullDayErr.join(', ') +
      '. Those days cannot have project hours.');
  }
  if (dayErrors.length) {
    throw new Error('Not saved. Hours on these days exceed the allowed amount (8 h minus leave or holiday): ' +
      dayErrors.join(', '));
  }

  const mismatches = [];
  new Set(Object.keys(targets).concat(Object.keys(projTotals))).forEach(p => {
    const entered = projTotals[p] || 0;
    const target = targets[p] || 0;
    if (Math.abs(entered - target) > ACTUAL_TOL) {
      mismatches.push(p + ': entered ' + entered.toFixed(2) + ', target ' + target.toFixed(2));
    }
  });
  if (Math.abs(grand - totalTarget) > ACTUAL_TOL) {
    mismatches.push('Month total: entered ' + grand.toFixed(2) + ', target ' + totalTarget.toFixed(2));
  }
  if (mismatches.length) {
    throw new Error('Not saved. Hours must match the target for each project and the month. ' +
      mismatches.join(' | '));
  }

  return withLock_(function () {
    const sh = ss().getSheetByName(TAB.TIME);
    const values = sh.getDataRange().getValues();
    for (let r = values.length - 1; r >= 1; r--) {
      if (values[r][1] === empId && values[r][5] === ACTUAL_TAG && inMonth(values[r][2], mNum, y)) {
        sh.deleteRow(r + 1);
      }
    }
    if (rows.length) {
      const start = sh.getLastRow() + 1;
      sh.getRange(start, 3, rows.length, 1).setNumberFormat('@');
      sh.getRange(start, 1, rows.length, 8).setValues(rows);
    }
    return { saved: rows.length, total: grand };
  });
}
