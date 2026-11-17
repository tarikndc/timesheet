// ===== SUBMIT, STATUS, PDF REPORT AND ADMIN SEARCH =====
const REPORT_FOLDER_ID = 'REPLACE_WITH_REPORT_FOLDER_ID';
const LOGO_FILE_ID = '1iqX54GNaIf9XLvjI-kB5fOUtsSJkRcAv';
const SIG_FILE_ID = 'REPLACE_WITH_SIGNATURE_FILE_ID';
function fmtDate_(v) {
  if (!v) return '';
  return Utilities.formatDate(new Date(v), Session.getScriptTimeZone(), 'dd MMM yyyy');
}

function fmtDateTime_(v) {
  if (!v) return '';
  return Utilities.formatDate(new Date(v), Session.getScriptTimeZone(), 'dd MMM yyyy, HH:mm');
}

function approvalRows_(empId, month, year) {
  return readTable(TAB.APPR)
    .filter(a => a.EmployeeID === empId && a.Month === month && Number(a.Year) === Number(year))
    .sort((a, b) => new Date(b.ApprovedAt) - new Date(a.ApprovedAt));
}

function canView_(emp, me) {
  if (me.isAdmin) return true;
  if (me.employee && me.employee.EmployeeID === emp.EmployeeID) return true;
  return String(emp.SupervisorEmail).toLowerCase() === me.email;
}

function empByEmail_(email) {
  const e = String(email || '').toLowerCase();
  return readTable(TAB.EMP).find(x => String(x.Email).toLowerCase() === e) || null;
}

/** "Name (ID)" for an employee record. */
function nameLabel_(emp) {
  return emp ? emp.EmployeeName + ' (' + emp.EmployeeID + ')' : '';
}

/** Short verification code from the approval details. */
function docRef_(empId, month, year, approvedAt, approverEmail) {
  const raw = [empId, month, year, new Date(approvedAt).toISOString(), approverEmail].join('|');
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  const hex = bytes.map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join('').toUpperCase();
  return hex.slice(0, 12).match(/.{4}/g).join('-');
}

/** Checks that web-entered hours match the targets for each project and the month. */
function checkMonthMatch_(empId, month, year) {
  const mNum = monthIndex(month);
  const y = Number(year);
  const report = monthReport(empId, month, y);
  const tt = targetsFor_(report);

  const entered = {};
  let grand = 0;
  readTable(TAB.TIME).forEach(t => {
    if (t.EmployeeID !== empId || t.EmailReference !== ACTUAL_TAG || !inMonth(t.WorkDate, mNum, y)) return;
    entered[t.ProjectName] = round2_((entered[t.ProjectName] || 0) + Number(t.Hours || 0));
    grand = round2_(grand + Number(t.Hours || 0));
  });

  const bad = [];
  Object.keys(tt.targets).forEach(p => {
    const e = entered[p] || 0;
    if (Math.abs(e - tt.targets[p]) > ACTUAL_TOL) {
      bad.push(p + ' entered ' + e.toFixed(2) + ' / target ' + tt.targets[p].toFixed(2));
    }
  });
  if (Math.abs(grand - tt.total) > ACTUAL_TOL) {
    bad.push('month total ' + grand.toFixed(2) + ' / target ' + tt.total.toFixed(2));
  }
  return { ok: bad.length === 0, message: bad.join('; ') };
}

/** Employee submits the month for approval. */
function submitTimesheet(month, year) {
  const me = currentUser();
  if (!me.employee) throw new Error('No employee record for this account.');
  const empId = me.employee.EmployeeID;
  const y = Number(year);

  const rows = approvalRows_(empId, month, y);
  const st = rows.length ? rows[0].Status : 'Not submitted';
  if (st === 'Submitted') throw new Error('This month is already submitted and waiting for approval.');
  if (st === 'Approved') throw new Error('This month is already approved.');

  const check = checkMonthMatch_(empId, month, y);
  if (!check.ok) throw new Error('Cannot submit yet. Hours do not match the target: ' + check.message);

  withLock_(function () {
    appendRows(TAB.APPR, [[newId('AP'), empId, month, y, me.employee.SupervisorEmail, 'Submitted', '', new Date()]]);
  });
  notifySubmitted_(me.employee, month, y);
  return { status: 'Submitted' };
}

/** Status for one employee's month. */
function getMonthStatus(empId, month, year) {
  const me = currentUser();
  const emp = readTable(TAB.EMP).find(e => e.EmployeeID === empId);
  if (!emp) throw new Error('Unknown employee.');
  if (!canView_(emp, me)) throw new Error('You are not allowed to view this employee.');

  const rows = approvalRows_(empId, month, year);
  const last = rows[0] || null;
  const sub = rows.find(r => r.Status === 'Submitted') || null;
  return {
    status: last ? last.Status : 'Not submitted',
    by: last ? last.SupervisorEmail : '',
    at: last ? fmtDateTime_(last.ApprovedAt) : '',
    comment: last ? (last.Comment || '') : '',
    submittedAt: sub ? fmtDateTime_(sub.ApprovedAt) : ''
  };
}

function getMyMonthStatus(month, year) {
  const me = currentUser();
  if (!me.employee) throw new Error('No employee record for this account.');
  return getMonthStatus(me.employee.EmployeeID, month, year);
}

/**
 * Returns the PDF as base64 for any stage (draft or approved).
 * Approved months are also saved to the Drive archive, if Drive is available.
 */
function getReport(empId, month, year) {
  const me = currentUser();
  const emp = readTable(TAB.EMP).find(e => e.EmployeeID === empId);
  if (!emp) throw new Error('Unknown employee.');
  if (!canView_(emp, me)) throw new Error('You are not allowed to view this report.');

  const y = Number(year);
  const rows = approvalRows_(empId, month, y);
  const latest = rows[0] || null;
  const approved = latest && latest.Status === 'Approved' ? latest : null;

  const blob = buildReportPdf_(emp, month, y, rows, approved);
  const base = y + '-' + pad2_(monthIndex(month)) + '_' + empId + '_' + safeName_(emp.EmployeeName);
  const fileName = (approved ? 'Timesheet_' : 'DRAFT_') + base + '.pdf';

  const b64 = Utilities.base64Encode(blob.getBytes());
  if (approved) {
    try { saveToArchive_(emp, month, y, blob); } catch (e) { Logger.log('Archive skipped: ' + e.message); }
  }
  return {
    pdfBase64: b64,
    filename: fileName,
    status: latest ? latest.Status : 'Not submitted'
  };
}

/** Builds the timesheet as a compact sheet and exports it to one A4 portrait page. */
function buildReportPdf_(emp, month, y, rows, approved) {
  const mNum = monthIndex(month);
  const report = monthReport(emp.EmployeeID, month, y);
  const lb = leaveByDay_(emp.EmployeeID, mNum, y);
  const hols = holidaysForMonth_(mNum, y);
  const days = buildMonthDays_(mNum, y);
  const byYmd = {};
  days.forEach(d => (byYmd[d.ymd] = d));

  const projects = [];
  report.rows.forEach(r => { if (projects.indexOf(r.project) < 0) projects.push(r.project); });
  readTable(TAB.TIME).forEach(t => {
    if (t.EmployeeID !== emp.EmployeeID || t.Status === 'Rejected' || !inMonth(t.WorkDate, mNum, y)) return;
    const d = byYmd[toYmd(t.WorkDate)];
    if (!d) return;
    d.hours[t.ProjectName] = round2_((d.hours[t.ProjectName] || 0) + Number(t.Hours || 0));
    if (projects.indexOf(t.ProjectName) < 0) projects.push(t.ProjectName);
  });
  if (!projects.length) projects.push('-');
  Object.keys(lb.byDay).forEach(k => { if (byYmd[k]) byYmd[k].leave = lb.byDay[k]; });

  const leaveCols = LEAVE_TYPES.concat(['Holiday']);
  const P = projects.length;
  const C_PROJ1 = 4;
  const C_PROJN = 3 + P;
  const C_SUB = C_PROJN + 1;
  const C_LV1 = C_SUB + 1;
  const C_LVN = C_LV1 + leaveCols.length - 1;
  const C_LSUB = C_LVN + 1;
  const C_GRAND = C_LSUB + 1;
  const NC = C_GRAND;

  const submitted = rows.find(r => r.Status === 'Submitted') || null;
  const isApproved = !!approved;
  const mgr = empByEmail_(emp.SupervisorEmail);
  const approverEmp = approved ? empByEmail_(approved.SupervisorEmail) : null;
  const ref = isApproved
    ? docRef_(emp.EmployeeID, month, y, approved.ApprovedAt, approved.SupervisorEmail)
    : 'Not approved yet';

  const grid = [];
  const blank = () => new Array(NC).fill('');
  const at = (arr, c, v) => { arr[c - 1] = v; };
  const cell = v => (Number(v) ? round2_(Number(v)) : '-');

  let a = blank();
    at(a, 1, '');
  at(a, NC, 'Time Sheet');
  grid.push(a);
  const titleRow = grid.length;

  a = blank();
  at(a, 1, isApproved ? '' : 'DRAFT: not yet approved. Use this copy for manual signature.');
  grid.push(a);
  const noticeRow = grid.length;

  const detailRows = [];
  const addDetail = (label, value) => {
    const r = blank();
    at(r, 1, label);
    at(r, 4, value);
    grid.push(r);
    detailRows.push(grid.length);
  };
  addDetail('Employee', nameLabel_(emp));
  addDetail('Month / Year', MONTHS[mNum - 1] + ' ' + y);
  addDetail('Manager', mgr ? nameLabel_(mgr) + ' Â· ' + emp.SupervisorEmail : emp.SupervisorEmail);
  addDetail('Status', isApproved ? 'Approved' : (rows.length ? rows[0].Status : 'Not submitted'));
  addDetail('Submitted by', submitted
    ? nameLabel_(emp) + ' Â· ' + fmtDateTime_(submitted.ApprovedAt)
    : 'Not submitted yet');
  addDetail('Approved by', isApproved
    ? (approverEmp ? nameLabel_(approverEmp) : approved.SupervisorEmail) + ' Â· ' + fmtDateTime_(approved.ApprovedAt)
    : 'Pending approval');
  addDetail('Manager comment', isApproved && approved.Comment ? approved.Comment : '-');
  addDetail('Document reference', ref);
  grid.push(blank());

  a = blank();
  at(a, C_PROJ1, 'Activity');
  at(a, C_LV1, 'Leave and Holidays');
  grid.push(a);
  const grpRow = grid.length;

  a = blank();
  at(a, 1, 'Day type');
  at(a, 2, 'Weekday');
  at(a, 3, 'Day');
  projects.forEach((p, i) => at(a, C_PROJ1 + i, p));
  at(a, C_SUB, 'Sub Total');
  leaveCols.forEach((l, i) => at(a, C_LV1 + i, l));
  at(a, C_LSUB, 'Sub Total');
  at(a, C_GRAND, 'Grand Total');
  grid.push(a);
  const hdrRow = grid.length;

  const projTot = {}; projects.forEach(p => (projTot[p] = 0));
  const leaveTot = {}; leaveCols.forEach(l => (leaveTot[l] = 0));
  let workT = 0, leaveT = 0, grandT = 0;
  const dayType = [];

  days.forEach(d => {
    const h = hols[d.ymd];
    let label = 'Working day';
    let shade = '';
    if (d.weekend) { label = 'Weekend'; shade = 'wk'; }
    else if (h) { label = 'Holiday'; shade = 'hol'; }
    dayType.push({ row: grid.length + 1, type: shade });

    a = blank();
    at(a, 1, label);
    at(a, 2, d.weekday);
    at(a, 3, d.day);

    let dw = 0;
    projects.forEach((p, i) => {
      const v = d.hours[p] || 0;
      dw = round2_(dw + v);
      projTot[p] = round2_(projTot[p] + v);
      at(a, C_PROJ1 + i, cell(v));
    });
    at(a, C_SUB, cell(dw));

    let dl = 0;
    leaveCols.forEach((l, i) => {
      const v = d.leave[l] || 0;
      dl = round2_(dl + v);
      leaveTot[l] = round2_(leaveTot[l] + v);
      at(a, C_LV1 + i, cell(v));
    });
    at(a, C_LSUB, cell(dl));

    const dg = round2_(dw + dl);
    at(a, C_GRAND, cell(dg));
    workT = round2_(workT + dw);
    leaveT = round2_(leaveT + dl);
    grandT = round2_(grandT + dg);
    grid.push(a);
  });
  const dataFirst = hdrRow + 1;
  const dataLast = grid.length;

  a = blank();
  at(a, 1, 'Total Hours');
  projects.forEach((p, i) => at(a, C_PROJ1 + i, cell(projTot[p])));
  at(a, C_SUB, cell(workT));
  leaveCols.forEach((l, i) => at(a, C_LV1 + i, cell(leaveTot[l])));
  at(a, C_LSUB, cell(leaveT));
  at(a, C_GRAND, cell(grandT));
  grid.push(a);
  const totRow = grid.length;
  grid.push(blank());

  a = blank(); at(a, 1, 'Allocation check'); grid.push(a);
  const allocTitleRow = grid.length;
  a = blank();
  at(a, 1, 'Project'); at(a, 4, 'Target'); at(a, 6, 'Entered'); at(a, 8, 'Difference');
  grid.push(a);
  const allocHdrRow = grid.length;
  const tt = targetsFor_(report);
  projects.forEach(p => {
    const target = tt.targets[p] || 0;
    const entered = projTot[p] || 0;
    a = blank();
    at(a, 1, p); at(a, 4, round2_(target)); at(a, 6, round2_(entered)); at(a, 8, round2_(entered - target));
    grid.push(a);
  });
  const allocLastRow = grid.length;
  grid.push(blank());

  a = blank(); at(a, 1, 'I certify that the above is true and correct.'); grid.push(a);
  const certRow = grid.length;

  const leftBoxEnd = Math.floor(NC / 2);
  const rLabel = leftBoxEnd + 1;
  const rBox = rLabel + 3;

  a = blank();
  at(a, 1, 'Employee Signature');
  at(a, rLabel, 'Manager Signature');
  grid.push(a);
  const sigRow1 = grid.length;

  a = blank();
  at(a, 1, 'Date');
  at(a, rLabel, 'Date');
  grid.push(a);
  const sigRow2 = grid.length;
  grid.push(blank());

  a = blank();
  at(a, 1, isApproved
    ? 'Electronically approved. The approval date, time and approver are recorded in the Timesheet system register. ' +
      'The document reference verifies this record.'
    : 'Draft copy. This timesheet is not yet approved.');
  grid.push(a);
  const stmtRow = grid.length;

  a = blank();
      at(a, 1, 'Developed by Tarik');
  grid.push(a);
  const footRow = grid.length;

  const total = grid.length;
    const tmp = scratchSheet_();
  try {
    const sh = tmp.getSheets()[0];
        sh.getImages().forEach(img => img.remove());
        sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).breakApart();
    sh.clear();
    sh.clearFormats();
    sh.setName('Timesheet');
    sh.setHiddenGridlines(true);

    const whole = sh.getRange(1, 1, total, NC);
    whole.setFontFamily('Arial').setFontSize(8).setVerticalAlignment('middle').setNumberFormat('General');
    detailRows.forEach(r => sh.getRange(r, 4, 1, NC - 3).setNumberFormat('@'));
    whole.setValues(grid);
    sh.setRowHeights(1, total, 15);

    const PAGE_W = 730;
    const firstW = 62;
    const leafW = 40;
    const fixed = firstW + 44 + 30 + 56 + leafW * leaveCols.length + 56 + 66;
    const projW = Math.max(40, Math.floor((PAGE_W - fixed) / P));
    const widths = [firstW, 44, 30].concat(projects.map(() => projW), [56],
      leaveCols.map(() => leafW), [56, 66]);
    widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));

        sh.setRowHeight(titleRow, 50);
    const logo = sh.insertImage(DriveApp.getFileById(LOGO_FILE_ID).getBlob(), 1, titleRow);
    logo.setWidth(94).setHeight(44);
    sh.getRange(titleRow, 1).setFontSize(18).setFontWeight('bold').setFontColor('#1f4e79');
    sh.getRange(titleRow, NC).setFontSize(12).setFontWeight('bold').setHorizontalAlignment('right');

    sh.getRange(noticeRow, 1, 1, NC).merge()
      .setFontColor('#b91c1c').setFontStyle('italic').setFontWeight('bold').setHorizontalAlignment('left');

    detailRows.forEach(r => {
      sh.getRange(r, 1, 1, 3).merge().setFontWeight('bold').setBackground('#f3f4f6');
      sh.getRange(r, 4, 1, NC - 3).merge().setHorizontalAlignment('left');
      sh.getRange(r, 1, 1, NC).setBorder(true, true, true, true, true, true);
    });

    if (P > 1) sh.getRange(grpRow, C_PROJ1, 1, P).merge();
    sh.getRange(grpRow, C_LV1, 1, leaveCols.length).merge();
    sh.getRange(grpRow, 1, hdrRow - grpRow + 1, NC)
      .setFontWeight('bold').setHorizontalAlignment('center').setWrap(true).setBackground('#f3f4f6');
    sh.setRowHeight(hdrRow, 30);
    sh.getRange(hdrRow, C_SUB).setFontColor('#d9482b');
    sh.getRange(hdrRow, C_LSUB).setFontColor('#d9482b');

    const n = dataLast - dataFirst + 1;
    sh.getRange(dataFirst, 1, n, 3).setHorizontalAlignment('center');
    sh.getRange(dataFirst, 4, n, NC - 3).setHorizontalAlignment('right').setNumberFormat('0.00');
    sh.getRange(dataFirst, C_SUB, n, 1).setFontColor('#d9482b').setFontWeight('bold');
    sh.getRange(dataFirst, C_LSUB, n, 1).setFontColor('#d9482b').setFontWeight('bold');
    sh.getRange(dataFirst, C_GRAND, n, 1).setFontWeight('bold');
    dayType.forEach(d => {
      if (d.type) sh.getRange(d.row, 1, 1, NC).setBackground(d.type === 'wk' ? '#dbe5f7' : '#f8d7d7');
    });
    sh.getRange(grpRow, 1, totRow - grpRow + 1, NC).setBorder(true, true, true, true, true, true);

    sh.getRange(totRow, 1, 1, NC).setFontWeight('bold').setBackground('#e5e7eb').setHorizontalAlignment('right');
    sh.getRange(totRow, 1, 1, 3).merge().setHorizontalAlignment('left');

    sh.getRange(allocTitleRow, 1).setFontWeight('bold').setFontSize(9);
    for (let r = allocHdrRow; r <= allocLastRow; r++) {
      sh.getRange(r, 1, 1, 3).merge();
      sh.getRange(r, 4, 1, 2).merge();
      sh.getRange(r, 6, 1, 2).merge();
      sh.getRange(r, 8, 1, 2).merge();
    }
    sh.getRange(allocHdrRow, 1, 1, 9).setFontWeight('bold').setBackground('#f3f4f6');
    sh.getRange(allocHdrRow + 1, 4, allocLastRow - allocHdrRow, 6).setHorizontalAlignment('right').setNumberFormat('0.00');
    sh.getRange(allocHdrRow, 1, allocLastRow - allocHdrRow + 1, 9).setBorder(true, true, true, true, true, true);

    sh.getRange(certRow, 1).setFontWeight('bold');

    sh.getRange(sigRow1, 1, 1, 3).merge().setFontWeight('bold').setBackground('#f3f4f6');
    sh.getRange(sigRow1, 4, 1, leftBoxEnd - 3).merge();
    sh.getRange(sigRow1, rLabel, 1, 3).merge().setFontWeight('bold').setBackground('#f3f4f6');
    sh.getRange(sigRow1, rBox, 1, NC - rBox + 1).merge();
    sh.getRange(sigRow2, 1, 1, 3).merge().setFontWeight('bold').setBackground('#f3f4f6');
    sh.getRange(sigRow2, 4, 1, leftBoxEnd - 3).merge();
    sh.getRange(sigRow2, rLabel, 1, 3).merge().setFontWeight('bold').setBackground('#f3f4f6');
    sh.getRange(sigRow2, rBox, 1, NC - rBox + 1).merge();
    sh.getRange(sigRow1, 1, 2, NC).setBorder(true, true, true, true, true, true);
    sh.setRowHeight(sigRow1, 30);
    sh.setRowHeight(sigRow2, 18);

    sh.getRange(stmtRow, 1, 1, NC).merge().setWrap(true).setFontStyle('italic').setFontSize(7);
    sh.setRowHeight(stmtRow, 24);
            sh.getRange(footRow, 1, 1, NC).merge().setFontSize(8).setFontColor('#555555').setHorizontalAlignment('center');
    sh.setRowHeight(footRow, 16);
    

    SpreadsheetApp.flush();

    const url = 'https://docs.google.com/spreadsheets/d/' + tmp.getId() +
      '/export?format=pdf&gid=' + sh.getSheetId() +
      '&size=A4&portrait=true&scale=2' +
      '&top_margin=0.3&bottom_margin=0.3&left_margin=0.3&right_margin=0.3' +
      '&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=false&fzr=false';
    const resp = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });
    if (resp.getResponseCode() !== 200) {
      throw new Error('PDF export failed (HTTP ' + resp.getResponseCode() + ').');
    }
    return resp.getBlob();
  } finally {
    try {
            // workspace is reused, so nothing is deleted here
    } catch (e) {
      Logger.log('Temp file cleanup skipped: ' + e.message);
    }
  }
}

// ===== DRIVE ARCHIVE (approved PDFs, saved by year and month) =====
function childFolder_(parent, name) {
  const it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

/** Timesheet Reports / 2026 / 09 September (created automatically) */
function archiveFolder_(y, mNum) {
  const root = DriveApp.getFolderById(REPORT_FOLDER_ID);
  return childFolder_(childFolder_(root, String(y)), pad2_(mNum) + ' ' + MONTHS[mNum - 1]);
}

function shareLink_(file) {
  try { file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  return file;
}

function safeName_(s) {
  return String(s || '').replace(/[\\\/:*?"<>|]/g, '').trim();
}

/** Saves one approved PDF into the archive, replacing any older copy with the same name. */
function saveToArchive_(emp, month, y, blob) {
  const mNum = monthIndex(month);
  const name = 'Timesheet_' + y + '-' + pad2_(mNum) + '_' + emp.EmployeeID + '_' + safeName_(emp.EmployeeName) + '.pdf';
  const folder = archiveFolder_(y, mNum);
  const old = folder.getFilesByName(name);
  while (old.hasNext()) old.next().setTrashed(true);
  const copy = blob.copyBlob().setName(name);
  return shareLink_(folder.createFile(copy));
}

/** Called when a manager approves (from Workflow.gs). */
function archiveApprovedReport_(empId, month, y) {
  const emp = readTable(TAB.EMP).find(e => e.EmployeeID === empId);
  if (!emp) throw new Error('Unknown employee.');
  const rows = approvalRows_(empId, month, y);
  const approved = rows.find(r => r.Status === 'Approved');
  if (!approved) throw new Error('This month is not approved.');
  const blob = buildReportPdf_(emp, month, Number(y), rows, approved);
  const file = saveToArchive_(emp, month, Number(y), blob);
  return { fileId: file.getId() };
}

/** Admin: creates archive PDFs for approved months that are missing from Drive. */
function rebuildReportArchive() {
  requireAdmin();
  const seen = {};
  readTable(TAB.APPR).forEach(a => {
    seen[a.EmployeeID + '|' + Number(a.Year) + '|' + a.Month] =
      { empId: a.EmployeeID, month: a.Month, year: Number(a.Year) };
  });
  let made = 0, notApproved = 0, failed = 0;
  Object.keys(seen).forEach(k => {
    const s = seen[k];
    const latest = approvalRows_(s.empId, s.month, s.year)[0];
    if (!latest || latest.Status !== 'Approved') { notApproved++; return; }
    try {
      archiveApprovedReport_(s.empId, s.month, s.year);
      made++;
    } catch (e) {
      failed++;
      Logger.log('Archive failed for ' + k + ': ' + e.message);
    }
  });
  return { made: made, notApproved: notApproved, failed: failed };
}

// ===== ADMIN SEARCH: every submission, from the approval records =====
function findReports(year, month, q) {
  requireAdmin();
  const yr = year ? Number(year) : null;
  const term = String(q || '').trim().toLowerCase();

  const empMap = {};
  readTable(TAB.EMP).forEach(e => (empMap[e.EmployeeID] = e));

  const groups = {};
  readTable(TAB.APPR).forEach(a => {
    const k = a.EmployeeID + '|' + Number(a.Year) + '|' + a.Month;
    (groups[k] = groups[k] || []).push(a);
  });

  const out = [];
  Object.keys(groups).forEach(k => {
    const list = groups[k].slice().sort((x, y) => new Date(y.ApprovedAt) - new Date(x.ApprovedAt));
    const latest = list[0];
    const y = Number(latest.Year);
    const emp = empMap[latest.EmployeeID] || {
      EmployeeID: latest.EmployeeID, EmployeeName: latest.EmployeeID, Email: '', SupervisorEmail: latest.SupervisorEmail
    };

    if (yr && y !== yr) return;
    if (month && latest.Month !== month) return;
    if (term && [emp.EmployeeName, emp.EmployeeID, emp.Email].every(v =>
      String(v).toLowerCase().indexOf(term) < 0)) return;

    const sub = list.find(r => r.Status === 'Submitted') || null;
    const approved = latest.Status === 'Approved' ? latest : null;
    const approver = approved ? empByEmail_(approved.SupervisorEmail) : null;
    const mgr = empByEmail_(emp.SupervisorEmail);

    out.push({
      employeeId: emp.EmployeeID,
      name: emp.EmployeeName,
      email: emp.Email,
      manager: mgr ? nameLabel_(mgr) : (emp.SupervisorEmail || ''),
      year: y,
      month: latest.Month,
      status: latest.Status,
      submittedOn: sub ? fmtDateTime_(sub.ApprovedAt) : '',
      approvedBy: approved ? (approver ? nameLabel_(approver) : approved.SupervisorEmail) : '',
      approvedOn: approved ? fmtDateTime_(approved.ApprovedAt) : '',
      docRef: approved ? docRef_(emp.EmployeeID, latest.Month, y, approved.ApprovedAt, approved.SupervisorEmail) : ''
    });
  });

  out.sort((a, b) =>
    (b.year - a.year) ||
    (monthIndex(b.month) - monthIndex(a.month)) ||
    String(a.name).localeCompare(String(b.name)));
  return out.slice(0, 500);
}
// One reusable workspace sheet for building PDFs (instead of a new file every time)
function scratchSheet_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('SCRATCH_SHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* recreate below */ }
  }
  const book = SpreadsheetApp.create('Timesheet PDF workspace (do not delete)');
  const file = DriveApp.getFileById(book.getId());
  DriveApp.getFolderById(REPORT_FOLDER_ID).addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  props.setProperty('SCRATCH_SHEET_ID', book.getId());
  return book;
}
/** Returns the signature for the web page footer only. It is never added to a PDF. */
function getFooterSignature() {
  try {
    const blob = DriveApp.getFileById(SIG_FILE_ID).getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    return '';
  }
}
/** Run once from the editor to remove old signature and logo copies from the PDF workspace. */
function clearWorkspaceImages() {
  const props = PropertiesService.getScriptProperties();
  const ids = [];
  const saved = props.getProperty('SCRATCH_SHEET_ID');
  if (saved) ids.push(saved);
  const files = DriveApp.getFilesByName('Timesheet PDF workspace (do not delete)');
  while (files.hasNext()) ids.push(files.next().getId());

  const unique = ids.filter((id, i) => ids.indexOf(id) === i);
  let cleared = 0;
  unique.forEach(id => {
    try {
      SpreadsheetApp.openById(id).getSheets().forEach(sh => {
        sh.getImages().forEach(img => { img.remove(); cleared++; });
      });
    } catch (e) {
      Logger.log('Could not open workspace ' + id + ': ' + e.message);
    }
  });
  Logger.log('Workspaces checked: ' + unique.length + '. Images removed: ' + cleared + '.');
}
