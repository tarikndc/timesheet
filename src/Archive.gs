// ===== PDF LINKS AND ARCHIVE LOOKUP =====
// PDFs are stored in Google Drive and opened with a normal link in a new tab.
const ARCHIVE_TAB = 'ReportIndex';
const ARCHIVE_HEADERS = ['Key', 'EmployeeID', 'Year', 'Month', 'Status', 'FileId', 'UpdatedOn'];

function archiveSheet_() {
  const book = ss();
  let sh = book.getSheetByName(ARCHIVE_TAB);
  if (!sh) {
    sh = book.insertSheet(ARCHIVE_TAB);
    sh.getRange(1, 1, 1, ARCHIVE_HEADERS.length).setValues([ARCHIVE_HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function archiveKey_(empId, y, month) {
  return empId + '|' + Number(y) + '|' + month;
}

function archiveRecord_(key) {
  return readTable(ARCHIVE_TAB).find(r => r.Key === key) || null;
}

function archiveWrite_(key, empId, y, month, status, fileId) {
  const sh = archiveSheet_();
  const row = [key, empId, Number(y), month, status, fileId, fmtDateTime_(new Date())];
  const found = archiveRecord_(key);
  if (found) {
    sh.getRange(found._row, 1, 1, row.length).setValues([row]);
  } else {
    sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
  }
}

/** Two links for a Drive file: one to view or print, one to download. */
function driveLinks_(fileId) {
  return {
    url: 'https://drive.google.com/file/d/' + fileId + '/view',
    dl: 'https://drive.google.com/uc?export=download&id=' + fileId
  };
}

function fileExists_(fileId) {
  try { return !DriveApp.getFileById(fileId).isTrashed(); } catch (e) { return false; }
}

/**
 * Returns links to the timesheet PDF.
 * Approved months use the archived PDF in Drive.
 * Other months use a draft copy in the Drafts folder.
 */
function getReportLink(empId, month, year) {
  const me = currentUser();
  const emp = readTable(TAB.EMP).find(e => e.EmployeeID === empId);
  if (!emp) throw new Error('Unknown employee.');
  if (!canView_(emp, me)) throw new Error('You are not allowed to open this report.');

  const y = Number(year);
  archiveSheet_();
  const key = archiveKey_(empId, y, month);
  const rows = approvalRows_(empId, month, y);
  const latest = rows[0] || null;

  if (latest && latest.Status === 'Approved') {
    const rec = archiveRecord_(key);
    if (rec && fileExists_(rec.FileId)) {
      return Object.assign({ status: 'Approved', name: 'Approved timesheet' }, driveLinks_(rec.FileId));
    }
    const blob = buildReportPdf_(emp, month, y, rows, latest);
    const file = saveToArchive_(emp, month, y, blob);
    archiveWrite_(key, empId, y, month, 'Approved', file.getId());
    return Object.assign({ status: 'Approved', name: file.getName() }, driveLinks_(file.getId()));
  }

  const blob = buildReportPdf_(emp, month, y, rows, null);
  const dname = 'DRAFT_' + y + '-' + pad2_(monthIndex(month)) + '_' + empId + '_' + safeName_(emp.EmployeeName) + '.pdf';
  const folder = childFolder_(DriveApp.getFolderById(REPORT_FOLDER_ID), 'Drafts');
  const old = folder.getFilesByName(dname);
  while (old.hasNext()) old.next().setTrashed(true);
  const file = shareLink_(folder.createFile(blob.copyBlob().setName(dname)));
  return Object.assign({ status: latest ? latest.Status : 'Not submitted', name: dname }, driveLinks_(file.getId()));
}

/** Admin: search results, with the stored PDF link where one exists. */
function findArchive(year, month, q) {
  requireAdmin();
  archiveSheet_();
  const list = findReports(year, month, q);
  const idx = {};
  readTable(ARCHIVE_TAB).forEach(r => (idx[r.Key] = r));
  return list.map(r => {
    const rec = idx[archiveKey_(r.employeeId, r.year, r.month)];
    const ok = rec && r.status === 'Approved' && fileExists_(rec.FileId);
    return Object.assign({}, r, ok ? driveLinks_(rec.FileId) : { url: '', dl: '' });
  });
}
// ===== ADMIN RESET: reopen an approved or submitted month =====
const RESET_TAB = 'ResetLog';

function resetSheet_() {
  const book = ss();
  let sh = book.getSheetByName(RESET_TAB);
  if (!sh) {
    sh = book.insertSheet(RESET_TAB);
    sh.getRange(1, 1, 1, 9).setValues([[
      'When', 'AdminEmail', 'EmployeeID', 'EmployeeName', 'Month', 'Year', 'PreviousStatus', 'Reason', 'HoursReopened'
    ]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Admin: removes a submitted, approved or returned month so the staff can edit and resubmit. */
function resetTimesheet(empId, month, year, reason) {
  requireAdmin();
  const me = currentUser();
  const y = Number(year);
  const why = String(reason || '').trim();
  if (why.length < 5) throw new Error('Enter a reason (at least 5 characters). It is saved in the reset log.');

  const emp = readTable(TAB.EMP).find(e => e.EmployeeID === empId);
  if (!emp) throw new Error('Unknown employee.');
  const rows = approvalRows_(empId, month, y);
  if (!rows.length) throw new Error('This month has no submission to reset.');
  const prevStatus = rows[0].Status;
  const mNum = monthIndex(month);
  const key = archiveKey_(empId, y, month);

  return withLock_(function () {
    // 1. Remove the approval records for this month
    const ash = ss().getSheetByName(TAB.APPR);
    const av = ash.getDataRange().getValues();
    for (let r = av.length - 1; r >= 1; r--) {
      if (av[r][1] === empId && av[r][2] === month && Number(av[r][3]) === y) ash.deleteRow(r + 1);
    }

    // 2. Reopen the hours: web entries become Submitted, email entries become Pending Review
    const tsh = ss().getSheetByName(TAB.TIME);
    const tv = tsh.getDataRange().getValues();
    const statCol = tv[0].indexOf('Status');
    let reopened = 0;
    for (let r = 1; r < tv.length; r++) {
      const row = tv[r];
      if (row[1] !== empId || !inMonth(row[2], mNum, y)) continue;
      if (row[statCol] === 'Approved' || row[statCol] === 'Returned') {
        tsh.getRange(r + 1, statCol + 1).setValue(row[5] === ACTUAL_TAG ? 'Submitted' : 'Pending Review');
        reopened++;
      }
    }

    // 3. Move the archived PDF to Trash and remove its index row
    archiveSheet_();
    const rec = archiveRecord_(key);
    if (rec) {
      if (rec.FileId) { try { DriveApp.getFileById(rec.FileId).setTrashed(true); } catch (e) { /* already gone */ } }
      ss().getSheetByName(ARCHIVE_TAB).deleteRow(rec._row);
    }

    // 4. Audit log
    resetSheet_().appendRow([new Date(), me.email, emp.EmployeeID, emp.EmployeeName,
      month, y, prevStatus, why, reopened]);

    // 5. Tell the staff member
    notifyDecision_(empId, month, y, 'Returned', 'Reopened by admin: ' + why);

    return { reset: true, previousStatus: prevStatus, hoursReopened: reopened };
  });
}
