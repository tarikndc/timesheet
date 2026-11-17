/**
 * Timesheet Management System - core server code
 * Data store: Google Sheet (see SHEET_ID)
 */

// ===== CONFIG =====
   const SHEET_ID = 'REPLACE_WITH_SHEET_ID';

const TAB = {
  EMP: 'Employees',
  PROJ: 'Projects',
  TIME: 'TimeEntries',
  LEAVE: 'LeaveEntries',
  APPR: 'Approvals',
  SET: 'Settings',
  ALLOC: 'MonthlyAllocations',
  HOL: 'Holidays'
};
const HEADERS = {
  Employees: ['EmployeeID', 'EmployeeName', 'Email', 'SupervisorEmail', 'Active'],
  Projects: ['ProjectName', 'Active'],
  TimeEntries: ['EntryID', 'EmployeeID', 'WorkDate', 'ProjectName', 'Hours', 'EmailReference', 'Status', 'EnteredAt'],
  LeaveEntries: ['EntryID', 'EmployeeID', 'LeaveDate', 'LeaveType', 'Hours', 'Status'],
  Approvals: ['TimesheetID', 'EmployeeID', 'Month', 'Year', 'SupervisorEmail', 'Status', 'Comment', 'ApprovedAt'],
  Settings: ['Setting', 'Value'],
  MonthlyAllocations: ['EmployeeID', 'Month', 'Year', 'ProjectName', 'AllocatedHours'],
  Holidays: ['Date', 'Name', 'Type', 'Hours']
};;

const DEFAULT_SETTINGS = {
  VarianceToleranceHours: 2,
  AdminEmails: '',                       // comma-separated, e.g. "you@org.org, colleague@org.org"
  ImportLabel: 'timesheet-inbox',        // Gmail label for incoming timesheet emails
  ProcessedLabel: 'timesheet-processed'  // Gmail label applied after import
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ===== WEB APP ENTRY =====
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Timesheet')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ===== DATA HELPERS =====
function ss() {
  return SpreadsheetApp.openById(SHEET_ID);
}

/** Reads a tab into an array of objects keyed by header. */
function readTable(tabName) {
  const sh = ss().getSheetByName(tabName);
  if (!sh) throw new Error('Missing tab: ' + tabName);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1)
    .map((row, i) => {
      const o = { _row: i + 2 };
      headers.forEach((h, j) => (o[h] = row[j]));
      return o;
    })
    .filter(o => headers.some(h => o[h] !== '' && o[h] !== null));
}

function appendRows(tabName, rows) {
  if (!rows.length) return;
  const sh = ss().getSheetByName(tabName);
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function getSettings() {
  const s = Object.assign({}, DEFAULT_SETTINGS);
  readTable(TAB.SET).forEach(r => {
    if (r.Setting) s[r.Setting] = r.Value;
  });
  return s;
}

function isTrue(v) {
  return v === true || String(v).toUpperCase() === 'TRUE';
}

function newId(prefix) {
  return prefix + '-' + Utilities.getUuid().slice(0, 8);
}

function monthIndex(name) {
  return MONTHS.indexOf(name) + 1;
}

// ===== AUTH & ROLES =====
/**
 * Returns the signed-in user's role.
 * admin   = listed in Settings.AdminEmails
 * manager = supervises at least one employee
 * staff   = everyone else who is an active employee
 */
function currentUser() {
  const email = (Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email) throw new Error('Please sign in with your Google Workspace account.');

  const employees = readTable(TAB.EMP);
  const emp = employees.find(e => String(e.Email).toLowerCase() === email && isTrue(e.Active)) || null;

  const admins = getSettings().AdminEmails.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const isAdmin = admins.includes(email);
  const isManager = employees.some(e => String(e.SupervisorEmail).toLowerCase() === email);

  if (!emp && !isAdmin) throw new Error('Your account is not registered in the timesheet system.');

  return {
    email: email,
    employee: emp,
    isAdmin: isAdmin,
    isManager: isManager,
    role: isAdmin ? 'admin' : (isManager ? 'manager' : 'staff')
  };
}

function requireAdmin() {
  if (!currentUser().isAdmin) throw new Error('Admin access required.');
}

// ===== API FOR THE WEB APP (called via google.script.run) =====

function getMe() {
  const me = currentUser();
  return {
    email: me.email,
    role: me.role,
    name: me.employee ? me.employee.EmployeeName : me.email,
    employeeId: me.employee ? me.employee.EmployeeID : null
  };
}

function getMyReport(month, year) {
  const me = currentUser();
  if (!me.employee) throw new Error('No employee record for this account.');
  return monthReport(me.employee.EmployeeID, month, year);
}

function getProjectsAndEmployees() {
  requireAdmin();
  return {
    projects: readTable(TAB.PROJ).filter(p => isTrue(p.Active)).map(p => p.ProjectName),
    employees: readTable(TAB.EMP).filter(e => isTrue(e.Active))
      .map(e => ({ id: e.EmployeeID, name: e.EmployeeName, email: e.Email }))
  };
}
// ===== BULK EMPLOYEE UPLOAD =====
function importEmployees(rows) {
  requireAdmin();
  const required = ['EmployeeID', 'EmployeeName', 'Email', 'SupervisorEmail', 'Active'];
  if (!rows || !rows.length) throw new Error('The file has no data rows.');
  if (rows.length > 500) throw new Error('Upload at most 500 employees at a time.');

  const existing = readTable(TAB.EMP);
  const byId = {};
  const byEmail = {};
  existing.forEach(e => {
    byId[String(e.EmployeeID).trim()] = e;
    byEmail[String(e.Email).trim().toLowerCase()] = e;
  });

  const errors = [];
  const seenIds = {};
  const seenEmails = {};
  const toAdd = [];
  const toUpdate = [];

  rows.forEach((r, i) => {
    const line = 'Row ' + (i + 2);
    required.forEach(h => {
      if (r[h] === undefined || String(r[h]).trim() === '') errors.push(line + ': ' + h + ' is empty');
    });
    const id = String(r.EmployeeID || '').trim();
    const name = String(r.EmployeeName || '').trim();
    const email = String(r.Email || '').trim().toLowerCase();
    const sup = String(r.SupervisorEmail || '').trim().toLowerCase();
    const act = String(r.Active || '').trim().toUpperCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(line + ': Email is not valid (' + email + ')');
    if (sup && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sup)) errors.push(line + ': SupervisorEmail is not valid');
    if (act !== 'TRUE' && act !== 'FALSE') errors.push(line + ': Active must be TRUE or FALSE');
    if (seenIds[id]) errors.push(line + ': EmployeeID ' + id + ' appears twice in the file');
    if (seenEmails[email]) errors.push(line + ': Email ' + email + ' appears twice in the file');
    seenIds[id] = true;
    seenEmails[email] = true;

    const row = [id, name, email, sup, act === 'TRUE'];
    if (byId[id]) {
      toUpdate.push({ row: byId[id]._row, values: row });
    } else if (byEmail[email]) {
      errors.push(line + ': Email ' + email + ' already belongs to EmployeeID ' + byEmail[email].EmployeeID);
    } else {
      toAdd.push(row);
    }
  });

  if (errors.length) {
    throw new Error('Nothing was saved. Fix these rows and upload again: ' + errors.slice(0, 30).join(' | ') +
      (errors.length > 30 ? ' | ...and ' + (errors.length - 30) + ' more' : ''));
  }

  return withLock_(function () {
    const sh = ss().getSheetByName(TAB.EMP);
    toUpdate.forEach(u => sh.getRange(u.row, 1, 1, 5).setValues([u.values]));
    if (toAdd.length) appendRows(TAB.EMP, toAdd);
    return { added: toAdd.length, updated: toUpdate.length };
  });
}
// ===== SHARED HELPERS (defined once, used by all files) =====
function pad2_(n) { return String(n).padStart(2, '0'); }
function round2_(n) { return Math.round(n * 100) / 100; }
const MAX_LEAVE_PER_DAY = 8;   // leave hours per date
const MAX_WORK_PER_DAY = 8;    // logged project hours per date

function getEmployeeSampleCsv() {
  requireAdmin();
  return {
    text: 'EmployeeID,EmployeeName,Email,SupervisorEmail,Active\n' +
      'iDE0001,Example Staff One,staff.one@ideglobal.org,manager@ideglobal.org,TRUE\n' +
      'iDE0002,Example Staff Two,staff.two@ideglobal.org,manager@ideglobal.org,TRUE\n' +
      'iDE0003,Example Manager,manager@ideglobal.org,,TRUE\n'
  };
}
