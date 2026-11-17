# Timesheet Management System

A web-based timesheet system built on Google Apps Script and Google Sheets. Staff record daily project hours and leave, managers approve each month, and administrators manage employees, allocations, holidays and the PDF report archive.

> Status: **Beta**. Developed by Tarik.

---

## Features

- Sign-in with Google Workspace accounts and role-based access (staff, manager, administrator)
- Monthly allocation per project, with leave shared across projects in proportion to their size
- Daily hours grid with server-checked rules
- Submit, approve or return a month with a comment
- Official A4 PDF with a digital approval record and document reference
- Holiday calendar (public and government) applied to every employee
- Bulk upload of employees and allocations by CSV
- Reset of a submitted or approved month, with the reason logged
- Email notifications with per-user preferences
- Searchable report archive stored in Google Drive

---

## Runbooks

| No. | Runbook | For |
|---|---|---|
| 01 | [Application Setup](docs/01-application-setup.md) | Administrators, developers |
| 02 | [Monthly Workflow](docs/02-monthly-workflow.md) | Everyone |
| 03 | [Staff Operations](docs/03-staff-operations.md) | Staff |
| 04 | [Manager Operations](docs/04-manager-operations.md) | Managers |
| 05 | [Administrator Operations](docs/05-administrator-operations.md) | Administrators |
| 06 | [Calculations](docs/06-calculations.md) | Everyone, for checking results |
| 07 | [Backups and Housekeeping](docs/07-backups-and-housekeeping.md) | Administrators |
| 08 | [Reset and Recovery](docs/08-reset-and-recovery.md) | Administrators |
| 09 | [Troubleshooting](docs/09-troubleshooting.md) | Everyone |
| 10 | [Staff How-To](docs/10-staff-how-to-use.md) | Staff, step by step with screenshots |
| 11 | [Administrator How-To](docs/11-admin-how-to-use.md) | Administrators, step by step with screenshots |

Reference: [Architecture](docs/reference/architecture.md) · [Data model](docs/reference/data-model.md) · [Screenshots](docs/SCREENSHOTS.md)

---

## Repository Layout

```
src/         Apps Script project (.gs files, Index.html, appsscript.json)
templates/   Sample CSV files for bulk upload
scripts/     sync-from-live.sh pulls the live project into src/; sanitize.py removes live IDs
docs/        Numbered runbooks, reference pages and screenshots
```

---

## Quick Start

1. Read [Runbook 01](docs/01-application-setup.md).
2. Create the Sheet and Drive folder, then replace the placeholders in `src/`.
3. Create the Apps Script project and paste the files from `src/`.
4. Run `setupWorkbook` once, then deploy the web app.

---

## Technology

| Layer | Technology |
|---|---|
| Front end | HTML, CSS and JavaScript in one page (`src/Index.html`) |
| Back end | Google Apps Script (V8 runtime) |
| Data store | Google Sheets (one tab per table) |
| File storage | Google Drive (approved and draft PDFs) |
| Notifications | Gmail through `MailApp` |
| Hosting | Apps Script web app, executed as the deployer, shared within the organisation |

---

## Known Limitations

- Chrome blocks printing from inside the web app, so PDFs open in a new tab.
- Bulk uploads are limited to 500 rows per file.
- PDFs take a few seconds to build.
- `Import.gs` holds an unused email-import feature. Its `withLock_()` helper is required.

---

## Licence

To be decided before publication. See [LICENSE](LICENSE).
