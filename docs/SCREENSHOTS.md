# Screenshots

## Objective

List every screenshot the runbooks refer to, with its file name and naming rule.

---

## Naming Rule

```
docs/screenshots/<role>/<NN>-<short-description>.png
```

- `<role>`: `setup`, `staff`, `manager`, `admin` or `pdf`
- `<NN>`: two digits, in reading order within the folder
- Description: lowercase letters, digits and hyphens only
- Format: PNG, about 1200 to 1400 px wide
- Use demo data only, for example `Example Staff One (iDE0001)`
- Never include signatures or real personal data

---

## Checklist

**Setup** (`setup/`)
- [ ] `01-sheet-tabs.png`: Sheet tabs along the bottom
- [ ] `02-settings-tab.png`: Settings tab (mask emails)
- [ ] `03-employees-tab.png`: Employees tab with demo rows
- [ ] `04-apps-script-files.png`: Files list in Apps Script
- [ ] `05-manifest-scopes.png`: `appsscript.json` in the editor
- [ ] `06-deploy-new-version.png`: Manage deployments with New version
- [ ] `07-web-app-signed-in.png`: Header with name, email and role

**Staff** (`staff/`)
- [ ] `01-my-month-overview.png`: Summary table and approval bar
- [ ] `02-leave-form.png`: Leave form and leave list
- [ ] `03-leave-holiday-row.png`: Holiday row in the leave list
- [ ] `04-daily-hours-grid.png`: Daily grid with targets and totals
- [ ] `05-daily-limit-popup.png`: Daily limit popup
- [ ] `06-grid-matched.png`: Difference row at 0.00
- [ ] `07-submit-for-approval.png`: Submit button and confirmation
- [ ] `08-status-submitted-locked.png`: Submitted status, grid locked
- [ ] `09-status-returned-comment.png`: Returned status with comment
- [ ] `10-print-download-pdf.png`: PDF opened in a new tab
- [ ] `11-email-preferences.png`: Notification preferences

**Manager** (`manager/`)
- [ ] `01-my-team-list.png`: My team table with status
- [ ] `02-review-month.png`: Employee month review
- [ ] `03-approve-or-return.png`: Approve and Return with comment box

**Admin** (`admin/`)
- [ ] `01-employee-list-search.png`: Employee list with search
- [ ] `02-allocation-grid.png`: Allocation grid
- [ ] `03-bulk-employee-upload.png`: Bulk employee upload card
- [ ] `04-bulk-allocation-upload.png`: Bulk allocation upload card
- [ ] `05-holidays.png`: Holiday list and add form
- [ ] `06-admins.png`: Admins card
- [ ] `07-report-archive.png`: Report archive with status counts
- [ ] `08-reset-timesheet.png`: Reset prompt with reason
- [ ] `09-export-approved.png`: Operations card with export

**PDF** (`pdf/`)
- [ ] `01-approved-report-full-page.png`: Whole approved page
- [ ] `02-draft-report-manual-signature.png`: Draft notice and signature boxes
- [ ] `03-digital-approval-record.png`: Approval record section
- [ ] `04-allocation-check.png`: Allocation check table

Total: 34 screenshots.
