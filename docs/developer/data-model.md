# Data model

The Google Sheet is the database. Each tab is a table, and the first row holds the headers.

| Tab | Columns | Purpose |
|---|---|---|
| Employees | EmployeeID, EmployeeName, Email, SupervisorEmail, Active | People, sign-in addresses and managers |
| Projects | ProjectName, Active | Projects that can be allocated and logged |
| MonthlyAllocations | EmployeeID, Month, Year, ProjectName, AllocatedHours | Planned hours per project per month |
| TimeEntries | EntryID, EmployeeID, WorkDate, ProjectName, Hours, EmailReference, Status, EnteredAt | Logged hours. Web entries use EmailReference = `WEB`. |
| LeaveEntries | EntryID, EmployeeID, LeaveDate, LeaveType, Hours, Status | Leave by date (full day 8 h, half day 4 h) |
| Holidays | Date, Name, Type, Hours | Public and government holidays |
| Approvals | TimesheetID, EmployeeID, Month, Year, SupervisorEmail, Status, Comment, ApprovedAt | Submitted, Approved and Returned records. The latest row per month is the status. |
| Settings | Setting, Value | VarianceToleranceHours, AdminEmails, ReportFolderId and others |
| Preferences | EmployeeID, Email, Master, Submitted, Decision, Holiday, Leave | Notification switches |
| ReportIndex | Key, EmployeeID, Year, Month, Status, FileId, UpdatedOn | Archived PDF for each approved month |
| ResetLog | When, AdminEmail, EmployeeID, EmployeeName, Month, Year, PreviousStatus, Reason, HoursReopened | Audit trail for resets |
| Export_YYYY_MM | Created by the export function | Snapshot of approved employees for a month |

## Status values

- TimeEntries.Status: `Submitted` (web entry), `Pending Review` (legacy email import), `Approved`, `Returned`, `Rejected`
- Approvals.Status: `Submitted`, `Approved`, `Returned`

## Rules kept by the app

- Dates are stored as text (`yyyy-mm-dd`) to avoid timezone shifts.
- Writes that change several rows are wrapped in `withLock_()`.
- Deleting or replacing rows always works from the bottom up, so row numbers stay valid.
