/**
 * Workflow: allocations (admin), approvals (manager), export (admin), setup.
 */

// ===== SETUP (run once from the Apps Script editor, or from Admin panel) =====
function setupWorkbook() {
  requireAdminOrFirstRun_();
  const book = ss();

  Object.keys(HEADERS).forEach(name => {
    const sh = book.getSheetByName(name) || book.insertSheet(name);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]).setFontWeight('bold');
    }
    sh.setFrozenRows(1);
  });

  // Default settings if missing
  const set = book.getSheetByName(TAB.SET);
  const existing = readTable(TAB.SET).map(r => r.Setting);
  const missing = Object.keys(DEFAULT_SETTINGS).filter(k => !existing.includes(k))
    .map(k => [k, DEFAULT_SETTINGS[k]]);
  appendRows(TAB.SET, missing);

  const empIdRange = book.getSheetByName(TAB.EMP).getRange(2, 1, 1000, 1);
  const projRange = book.getSheetByName(TAB.PROJ).getRange(2, 1, 500, 1);
  const MAX = 5000;

  // TimeEntries: EmployeeID, WorkDate, ProjectName, Hours
  const time = book.getSheetByName(TAB.TIME);
  time.getRange(2, 2, MAX, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(empIdRange, true).build());
  time.getRange(2, 3, MAX, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireDate().build());
  time.getRange(2, 4, MAX, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(projRange, true).build());
  time.getRange(2, 5, MAX, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireNumberBetween(0.01, 24).build());

  // MonthlyAllocations: EmployeeID, Month, Year, ProjectName
  const alloc = book.getSheetByName(TAB.ALLOC);
  alloc.getRange(2, 1, MAX, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(empIdRange, true).build());
  alloc.getRange(2, 2, MAX, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(MONTHS, true).build());
  alloc.getRange(2, 3, MAX, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireNumberBetween(2020, 2040).build());
  alloc.getRange(2, 4, MAX, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(projRange, true).build());

  return 'Workbook ready.';
}

/** Allows setup on first run when no admins are configured yet. */
function requireAdminOrFirstRun_() {
   const sh = ss().getSheetByName(TAB.SET);
  if (!sh) return; // Settings tab not created yet, so this is the first run
  const admins = getSettings().AdminEmails.trim();
  if (!admins) return; // no admins configured yet
  requireAdmin();
}

// ===== ALLOCATIONS (guided form + CSV) =====

/**
 * Replaces one employee's allocations for a month/year.
 * rows: [{ project: 'Name', hours: 20 }, ...]
 */
function saveAllocations(employeeId, month, year, rows) {
  requireAdmin();
  const validProjects = new Set(readTable(TAB.PROJ).filter(p => isTrue(p.Active)).map(p => p.ProjectName));
  const emp = readTable(TAB.EMP).find(e => e.EmployeeID === employeeId);
  if (!emp) throw new Error('Unknown employee.');
  if (MONTHS.indexOf(month) < 0) throw new Error('Invalid month.');
  if (!(Number(year) >= 2020 && Number(year) <= 2040)) throw new Error('Year must be 2020â€“2040.');

  const clean = rows.filter(r => r.project).map(r => {
    if (!validProjects.has(r.project)) throw new Error('Unknown project: ' + r.project);
    const h = Number(r.hours);
    if (!(h >= 0)) throw new Error('Hours must be zero or more.');
    return [employeeId, month, Number(year), r.project, h];
  });

  return withLock_(function () {
    deleteAllocationRows_(employeeId, month, Number(year));
    appendRows(TAB.ALLOC, clean);
    return { saved: clean.length };
  });
}

/** Rows: [{EmployeeID|email, Month, Year, ProjectName, AllocatedHours}] */
function importAllocationsCsv(rows) {
  requireAdmin();
  const emps = readTable(TAB.EMP);
  const validProjects = new Set(readTable(TAB.PROJ).filter(p => isTrue(p.Active)).map(p => p.ProjectName));
  const errors = [];
  const out = [];

  rows.forEach((r, i) => {
    const emp = emps.find(e => e.EmployeeID === r.EmployeeID ||
      String(e.Email).toLowerCase() === String(r.Email || '').toLowerCase());
    if (!emp) return errors.push('Row ' + (i + 2) + ': unknown employee');
    if (MONTHS.indexOf(r.Month) < 0) return errors.push('Row ' + (i + 2) + ': bad month');
    if (!validProjects.has(r.ProjectName)) return errors.push('Row ' + (i + 2) + ': unknown project "' + r.ProjectName + '"');
    const h = Number(r.AllocatedHours);
    if (!(h >= 0)) return errors.push('Row ' + (i + 2) + ': bad hours');
    out.push([emp.EmployeeID, r.Month, Number(r.Year), r.ProjectName, h]);
  });

  if (errors.length) return { imported: 0, errors: errors };

  return withLock_(function () {
    // Replace per employee-month in this file
    const keys = new Set(out.map(r => r[0] + '|' + r[1] + '|' + r[2]));
    keys.forEach(k => {
      const [id, m, y] = k.split('|');
      deleteAllocationRows_(id, m, Number(y));
    });
    appendRows(TAB.ALLOC, out);
    return { imported: out.length, errors: [] };
  });
}

function deleteAllocationRows_(employeeId, month, year) {
  const sh = ss().getSheetByName(TAB.ALLOC);
  const values = sh.getDataRange().getValues();
  for (let r = values.length - 1; r >= 1; r--) {
    if (values[r][0] === employeeId && values[r][1] === month && Number(values[r][2]) === year) {
      sh.deleteRow(r + 1);
    }
  }
}

// ===== APPROVALS (manager) =====

function latestApprovalStatus(employeeId, month, year) {
  const rows = readTable(TAB.APPR)
    .filter(a => a.EmployeeID === employeeId && a.Month === month && Number(a.Year) === Number(year))
    .sort((a, b) => new Date(b.ApprovedAt) - new Date(a.ApprovedAt));
  return rows.length ? rows[0].Status : 'Not submitted';
}

/** Team view for managers (their reports) or admins (everyone). */
function getTeam(month, year) {
  const me = currentUser();
  let team = readTable(TAB.EMP).filter(e => isTrue(e.Active));
  if (!me.isAdmin) {
    team = team.filter(e => String(e.SupervisorEmail).toLowerCase() === me.email);
  }
  return team.map(e => {
    const rep = monthReport(e.EmployeeID, month, year);
    return {
      employeeId: e.EmployeeID,
      name: e.EmployeeName,
      totalAllocated: rep.totalAllocated,
      totalLeave: rep.totalLeave,
      flagged: rep.flaggedCount,
      status: latestApprovalStatus(e.EmployeeID, month, year)
    };
  });
}

function getEmployeeReportForReview(employeeId, month, year) {
  const me = currentUser();
  const emp = readTable(TAB.EMP).find(e => e.EmployeeID === employeeId);
  if (!emp) throw new Error('Unknown employee.');
  if (!me.isAdmin && String(emp.SupervisorEmail).toLowerCase() !== me.email) {
    throw new Error('You can only review your direct reports.');
  }
  return monthReport(employeeId, month, year);
}

/**
 * action: 'approve' | 'return'
 * approve -> entries become 'Approved'; return -> entries become 'Returned' for correction.
 */
function approveTimesheet(employeeId, month, year, action, comment) {
  const me = currentUser();
  const emp = readTable(TAB.EMP).find(e => e.EmployeeID === employeeId);
  if (!emp) throw new Error('Unknown employee.');
  if (!me.isAdmin && String(emp.SupervisorEmail).toLowerCase() !== me.email) {
    throw new Error('You can only approve your direct reports.');
  }
  if (action !== 'approve' && action !== 'return') throw new Error('Invalid action.');

  const status = action === 'approve' ? 'Approved' : 'Returned';
  return withLock_(function () {
    const sh = ss().getSheetByName(TAB.TIME);
    const values = sh.getDataRange().getValues();
    const h = values[0];
    const idCol = h.indexOf('EmployeeID'), dateCol = h.indexOf('WorkDate'), statCol = h.indexOf('Status');
    const mNum = monthIndex(month);
    let changed = 0;
    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (row[idCol] !== employeeId) continue;
      const d = row[dateCol] instanceof Date ? row[dateCol] : new Date(row[dateCol]);
      if (d.getMonth() + 1 !== mNum || d.getFullYear() !== Number(year)) continue;
      if (row[statCol] === 'Rejected') continue;
      sh.getRange(r + 1, statCol + 1).setValue(status);
      changed++;
    }
    appendRows(TAB.APPR, [[newId('AP'), employeeId, month, Number(year), me.email,
      status, comment || '', new Date()]]);
          notifyDecision_(employeeId, month, year, status, comment);
              if (action === 'approve') { try { archiveApprovedReport_(employeeId, month, Number(year), true); } catch (e) { Logger.log('Archive failed: ' + e.message); } }
    return { updated: changed, status: status };
  });
}

// ===== EXPORT (admin) =====

/**
 * Writes approved employees' variance report to a new tab.
 * Only employees whose latest status is 'Approved' are included.
 */
function exportApproved(month, year) {
  requireAdmin();
  const emps = readTable(TAB.EMP).filter(e => isTrue(e.Active));
  const out = [['EmployeeID', 'EmployeeName', 'Project', 'Allocated', 'LeaveShare',
    'Adjusted', 'Actual', 'Variance', 'Flag']];
  let included = 0;

  emps.forEach(e => {
    if (latestApprovalStatus(e.EmployeeID, month, year) !== 'Approved') return;
    included++;
    monthReport(e.EmployeeID, month, year).rows.forEach(r => {
      out.push([e.EmployeeID, e.EmployeeName, r.project, r.allocated, r.leaveShare,
        r.adjusted, r.actual, r.variance, r.flag ? 'REVIEW' : '']);
    });
  });

  const tabName = 'Export_' + year + '_' + String(monthIndex(month)).padStart(2, '0');
  const book = ss();
  const sh = book.getSheetByName(tabName) || book.insertSheet(tabName);
  sh.clear();
  sh.getRange(1, 1, out.length, out[0].length).setValues(out);
  sh.getRange(1, 1, 1, out[0].length).setFontWeight('bold');
  if (out.length > 1) sh.getRange(2, 4, out.length - 1, 5).setNumberFormat('0.00');
  sh.setFrozenRows(1);

  return { tab: tabName, employees: included, url: book.getUrl() + '#gid=' + sh.getSheetId() };
}
// ===== GRID ALLOCATION (admin: months as rows, projects as columns) =====

function getEmployeesForAdmin() {
  requireAdmin();
  return readTable(TAB.EMP).map(e => ({
    id: e.EmployeeID,
    name: e.EmployeeName,
    email: e.Email,
    supervisor: e.SupervisorEmail,
    active: isTrue(e.Active)
  }));
}

/** Returns the project columns in use for this employee/year, plus the grid values. */
function getAllocationGrid(employeeId, year) {
  requireAdmin();
  year = Number(year);
  const grid = {};
  MONTHS.forEach(m => (grid[m] = {}));
  const columns = [];

  readTable(TAB.ALLOC).forEach(a => {
    if (a.EmployeeID === employeeId && Number(a.Year) === year && grid[a.Month]) {
      grid[a.Month][a.ProjectName] = Number(a.AllocatedHours);
      if (!columns.includes(a.ProjectName)) columns.push(a.ProjectName);
    }
  });
  return { columns: columns, grid: grid };
}

/**
 * Replaces all allocations for one employee and year.
 * columns: ['Project A', 'Project B', ...]
 * grid: { January: { 'Project A': 80, 'Project B': '' }, ... }
 */
function saveAllocationGrid(employeeId, year, columns, grid) {
  requireAdmin();
  year = Number(year);
  if (!(year >= 2020 && year <= 2040)) throw new Error('Year must be 2020â€“2040.');

  const emp = readTable(TAB.EMP).find(e => e.EmployeeID === employeeId);
  if (!emp) throw new Error('Unknown employee.');

  const validProjects = new Set(readTable(TAB.PROJ).filter(p => isTrue(p.Active)).map(p => p.ProjectName));
  const rows = [];

  MONTHS.forEach(m => {
    columns.forEach(p => {
      const raw = grid[m] ? grid[m][p] : '';
      if (raw === '' || raw === null || raw === undefined) return;
      const h = Number(raw);
      if (!(h >= 0) || h > 744) throw new Error('Invalid hours for ' + m + ' / ' + p + '.');
      if (!validProjects.has(p)) throw new Error('Inactive or unknown project: ' + p);
      if (h > 0) rows.push([employeeId, m, year, p, h]);
    });
  });

  return withLock_(function () {
    deleteEmployeeYearRows_(employeeId, year);
    appendRows(TAB.ALLOC, rows);
    return { saved: rows.length };
  });
}

function deleteEmployeeYearRows_(employeeId, year) {
  const sh = ss().getSheetByName(TAB.ALLOC);
  const values = sh.getDataRange().getValues();
  for (let r = values.length - 1; r >= 1; r--) {
    if (values[r][0] === employeeId && Number(values[r][2]) === year) {
      sh.deleteRow(r + 1);
    }
  }
}
