// ===== EMAIL NOTIFICATIONS AND PREFERENCES =====
const PREF_TAB = 'Preferences';
const PREF_HEADERS = ['EmployeeID', 'Email', 'Master', 'Submitted', 'Decision', 'Holiday', 'Leave'];
const PREF_DEFAULT = { Master: true, Submitted: true, Decision: true, Holiday: true, Leave: false };
const PREF_LABELS = {
  Submitted: 'Email me when a team member submits a timesheet for approval (managers)',
  Decision: 'Email me when my timesheet is approved or returned',
  Holiday: 'Email me when a public or government holiday is added',
  Leave: 'Email me when a team member adds leave (managers)'
};

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function prefSheet_() {
  const book = ss();
  let sh = book.getSheetByName(PREF_TAB);
  if (!sh) {
    sh = book.insertSheet(PREF_TAB);
    sh.getRange(1, 1, 1, PREF_HEADERS.length).setValues([PREF_HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function prefRow_(empId) {
  const values = prefSheet_().getDataRange().getValues();
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][0]) === String(empId)) return { row: r + 1, values: values[r] };
  }
  return null;
}

function readPrefs_(empId) {
  const p = Object.assign({}, PREF_DEFAULT);
  const row = prefRow_(empId);
  if (row) {
    const v = row.values;
    p.Master = isTrue(v[2]);
    p.Submitted = isTrue(v[3]);
    p.Decision = isTrue(v[4]);
    p.Holiday = isTrue(v[5]);
    p.Leave = isTrue(v[6]);
  }
  return p;
}

/** Returns the signed-in user's preferences for the page. */
function getMyPrefs() {
  const me = currentUser();
  if (!me.employee) throw new Error('No employee record for this account.');
  return { prefs: readPrefs_(me.employee.EmployeeID), labels: PREF_LABELS, isManager: me.isManager };
}

/** Saves the signed-in user's preferences. */
function saveMyPrefs(prefs) {
  const me = currentUser();
  if (!me.employee) throw new Error('No employee record for this account.');
  const empId = me.employee.EmployeeID;
  const row = [empId, me.email, !!prefs.Master, !!prefs.Submitted, !!prefs.Decision, !!prefs.Holiday, !!prefs.Leave];
  return withLock_(function () {
    const sh = prefSheet_();
    const existing = prefRow_(empId);
    if (existing) {
      sh.getRange(existing.row, 1, 1, row.length).setValues([row]);
    } else {
      sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    }
    return { saved: true };
  });
}

/** Sends one email if the recipient has that notification switched on. Never blocks the main action. */
function sendNotice_(empId, key, subject, bodyHtml) {
  try {
    const emp = readTable(TAB.EMP).find(e => e.EmployeeID === empId);
    if (!emp || !isTrue(emp.Active) || !emp.Email) return;
    const p = readPrefs_(empId);
    if (!p.Master || !p[key]) return;
    MailApp.sendEmail({
      to: emp.Email,
      subject: '[Timesheet] ' + subject,
      htmlBody: '<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">' + bodyHtml +
        '<hr><p style="font-size:11px;color:#666">Developed by Tarik. Change your email notifications in the Timesheet app under My month.</p></div>',
      name: 'Timesheet'
    });
  } catch (e) {
    Logger.log('Notification not sent: ' + e.message);
  }
}

function notifySubmitted_(emp, month, year) {
  const mgr = empByEmail_(emp.SupervisorEmail);
  if (!mgr) return;
  sendNotice_(mgr.EmployeeID, 'Submitted',
    'Timesheet submitted: ' + emp.EmployeeName + ' Â· ' + month + ' ' + year,
    '<p><b>' + esc_(emp.EmployeeName) + '</b> (' + esc_(emp.EmployeeID) + ') submitted the timesheet for <b>' +
    esc_(month) + ' ' + year + '</b> for your approval.</p><p>Open the app and go to My team to review it.</p>');
}

function notifyDecision_(empId, month, year, status, comment) {
  const approved = status === 'Approved';
  sendNotice_(empId, 'Decision',
    (approved ? 'Timesheet approved: ' : 'Timesheet returned for correction: ') + month + ' ' + year,
    '<p>Your timesheet for <b>' + esc_(month) + ' ' + year + '</b> was <b>' +
    (approved ? 'approved' : 'returned for correction') + '</b>.</p>' +
    (comment ? '<p>Manager comment: ' + esc_(comment) + '</p>' : ''));
}

function notifyHoliday_(dateStr, name, type) {
  readTable(TAB.EMP).filter(e => isTrue(e.Active)).forEach(e => {
    sendNotice_(e.EmployeeID, 'Holiday',
      'Holiday added: ' + name + ' (' + dateStr + ')',
      '<p>A ' + esc_(type) + ' holiday <b>' + esc_(name) + '</b> on <b>' + esc_(dateStr) +
      '</b> has been added. It counts as 8 h of leave, and project hours are locked for that date.</p>');
  });
}

function notifyLeave_(empId, fromStr, toStr, type, count) {
  const emp = readTable(TAB.EMP).find(e => e.EmployeeID === empId);
  if (!emp) return;
  const mgr = empByEmail_(emp.SupervisorEmail);
  if (!mgr) return;
  sendNotice_(mgr.EmployeeID, 'Leave',
    'Leave added: ' + emp.EmployeeName,
    '<p><b>' + esc_(emp.EmployeeName) + '</b> added ' + esc_(type) + ' leave from <b>' + esc_(fromStr) +
    '</b> to <b>' + esc_(toStr) + '</b> (' + count + ' day(s)).</p>');
}
