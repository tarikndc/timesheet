# Runbook 07: Backups and Housekeeping

## Objective

Keep the data, the archive and the Drive folders safe and tidy.

---

## Backups

- **Sheet:** make a copy (**File → Make a copy**) at each month end, or rely on version history.
- **Archive:** keep `Timesheet Reports` covered by your organisation's Drive backup.
- **Excel copy:** export the Sheet at each month end as an extra record.

---

## Monthly Housekeeping

- Empty the Drive Trash. Resets and draft replacements move old PDFs there.
- Keep the file **Timesheet PDF workspace (do not delete)**. The app reuses it.
- Review the **ResetLog** tab.

---

## Quotas

Apps Script limits email sends and Drive operations per day. Add holidays one at a time, because each one sends notices to every employee. Run archive rebuilds outside peak hours.

---

## Releasing a New Version

1. Test the change in a copy of the Apps Script project.
2. Copy the changed files into the live project, or run `clasp push`.
3. **Deploy → Manage deployments → pencil icon → New version → Deploy.**
4. Reload the web app with Ctrl+Shift+R.
5. Record the change in `CHANGELOG.md`.

The URL stays the same, so users do not need a new link.

---

## Permission Changes

If the manifest changes, approve again: remove the app at myaccount.google.com/permissions, run a function from the editor, and approve.
