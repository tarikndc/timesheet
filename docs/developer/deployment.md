# Deployment and operations

## Releasing a new version

1. Test the change in a copy of the Apps Script project.
2. Copy the changed files into the live project (or `clasp push`).
3. Click **Deploy → Manage deployments → pencil icon → New version → Deploy**.
4. Reload the web app with Ctrl+Shift+R.
5. Record the change in `CHANGELOG.md`.

Users see the new version after a reload. Keep the same deployment so the URL does not change.

## Permissions

The manifest requests Sheets, Drive, Gmail (send mail), external requests, user email and profile. When permissions change, the deployer must approve again: remove the app at myaccount.google.com/permissions, run a function from the editor, and approve.

## Access

Deploy with **Execute as: Me** and **Who has access: Anyone within your organisation**. Only accounts in the Workspace domain can open the app, and only registered employees or admins get past sign-in.

## Backups

- Use **File → Make a copy** on the Sheet regularly, or enable version history.
- Keep the Drive archive folder backed up with your organisation's standard Drive backup.
- Export the Sheet to Excel at each month end as an extra copy.

## Quotas

Apps Script limits email sends and Drive operations per day. Holiday notices go to every employee, so add holidays one at a time. Large archive rebuilds can take several minutes; run them outside peak hours.

## Housekeeping

- Empty the Drive Trash monthly, since reset and draft replacement move old PDFs there.
- Keep the **Timesheet PDF workspace** file. The app reuses it. Do not delete it.
- Review the **ResetLog** tab monthly.
