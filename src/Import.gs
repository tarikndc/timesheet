/**
 * Email import.
 *
 * Expected email body lines (one entry per line):
 *   2026-10-05 | Project Name | 7.5
 * Separators may be |, comma or semicolon. Non-matching lines are ignored
 * unless they start with a date, in which case they're reported as errors.
 *
 * Run importTimesheetEmails() on a time-driven trigger (e.g., hourly)
 * or from the Admin panel.
 */

function extractEmail(fromHeader) {
  const m = String(fromHeader).match(/<([^>]+)>/);
  return (m ? m[1] : String(fromHeader)).trim().toLowerCase();
}

function importTimesheetEmails() {
  return withLock_(function () {
    const s = getSettings();
    const inbox = GmailApp.getUserLabelByName(s.ImportLabel);
    if (!inbox) return { imported: 0, errors: ['Gmail label not found: ' + s.ImportLabel] };

    const done = GmailApp.getUserLabelByName(s.ProcessedLabel) || GmailApp.createLabel(s.ProcessedLabel);

    const employees = readTable(TAB.EMP).filter(e => isTrue(e.Active));
    const projects = new Set(readTable(TAB.PROJ).filter(p => isTrue(p.Active)).map(p => p.ProjectName));
    const seenRefs = new Set(readTable(TAB.TIME).map(t => String(t.EmailReference)));

    const newRows = [];
    const errors = [];
    const now = new Date();

    inbox.getThreads(0, 100).forEach(thread => {
      thread.getMessages().forEach(msg => {
        const ref = msg.getId();
        if (seenRefs.has(ref)) return;

        const sender = extractEmail(msg.getFrom());
        const emp = employees.find(e => String(e.Email).toLowerCase() === sender);
        if (!emp) {
          errors.push('Unknown sender: ' + sender);
          return;
        }

        msg.getPlainBody().split(/\r?\n/).forEach((line, idx) => {
          const m = line.match(/^\s*(\d{4}-\d{2}-\d{2})\s*[|,;]\s*(.+?)\s*[|,;]\s*(\d+(?:\.\d+)?)\s*$/);
          if (!m) {
            if (/^\s*\d{4}-\d{2}-\d{2}/.test(line)) {
              errors.push(sender + ' line ' + (idx + 1) + ': could not parse "' + line.trim() + '"');
            }
            return;
          }
          const [, dateStr, project, hoursStr] = m;
          const hours = Number(hoursStr);
          const workDate = new Date(dateStr + 'T00:00:00');

          if (!projects.has(project.trim())) {
            errors.push(sender + ' line ' + (idx + 1) + ': unknown project "' + project.trim() + '"');
            return;
          }
          if (isNaN(workDate.getTime()) || hours < 0.01 || hours > 24) {
            errors.push(sender + ' line ' + (idx + 1) + ': invalid date or hours');
            return;
          }

          newRows.push([
            newId('TE'), emp.EmployeeID, workDate, project.trim(), hours, ref, 'Pending Review', now
          ]);
        });

        // Mark processed; add a row-level ref so the message is never re-read
        seenRefs.add(ref);
        thread.removeLabel(inbox).addLabel(done);
      });
    });

    appendRows(TAB.TIME, newRows);
    return { imported: newRows.length, errors: errors };
  });
}

/** Simple lock wrapper so imports and approvals never write at the same time. */
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}
