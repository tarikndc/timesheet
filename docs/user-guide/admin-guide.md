# Administrator guide

Administrators are listed in the `AdminEmails` setting. An admin sees the **Admin** tab in addition to the staff and manager views.

## 1. First-time checks

1. Confirm the Google Sheet has these tabs: Employees, Projects, TimeEntries, LeaveEntries, Approvals, Settings, MonthlyAllocations, Holidays, ReportIndex, ResetLog.
2. In **Settings**, check `AdminEmails` lists the admin addresses, comma-separated.
3. Check `VarianceToleranceHours` (default 2).

## 2. Employees

Every person who uses the system needs a row in **Employees**:

| Column | Meaning |
|---|---|
| EmployeeID | Staff ID, for example iDE0001 |
| EmployeeName | Full name |
| Email | Google Workspace address used to sign in |
| SupervisorEmail | Manager's address. Leave blank for no manager. |
| Active | TRUE or FALSE |

### Bulk upload

1. Under **Bulk employee upload**, click **Download sample CSV**. The sample appears in a box; copy it into Notepad and save as `employees.csv`.
2. Edit the rows. Keep the header row unchanged.
3. Choose the file and click **Upload employees CSV**.

Existing EmployeeIDs are updated. New ones are added. If any row fails, nothing is saved and every problem is listed with its row number. Limit: 500 rows per file.

To remove access for someone who has left, set **Active** to FALSE. Their past records are kept.

## 3. Projects

Add each project name to the **Projects** tab with Active = TRUE. A project must exist here before it can be allocated or logged.

## 4. Monthly allocation

### One employee at a time

1. Go to **Admin**, search for and select the employee.
2. Choose the year and click **Load year**.
3. Click **+ Add project** to add a project column.
4. Enter hours in the month rows. Totals update as you type.
5. Click **Save allocation**. This replaces that employee's allocations for the whole year.

### Bulk allocation CSV

Use the **Bulk allocation upload** card. Columns:

```
EmployeeID,Month,Year,ProjectName,AllocatedHours
```

Month must be a full month name, such as September. ProjectName must exist in the Projects tab. A file is validated first; if any row is wrong, nothing is saved. Each employee-month in the file is replaced.

A sample is in `templates/allocations_sample.csv`.

Allocation sets the monthly targets. The daily limit (8 h) controls how hours are entered each day.

## 5. Holidays

Under **Public and government holidays**, add each date with a name and type (Public or Government). Each holiday counts as 8 h of leave for every employee and locks project hours that day. Friday and Saturday cannot be added.

Adding a holiday can send notification emails to staff who have that option on.

## 6. Admins

Under **Admins**, add or remove administrator emails. You cannot remove yourself, and at least one admin must remain.

## 7. Report archive

**Report archive** lists every submission, grouped by month, with staff, manager, status, dates and the approver.

- Use **Year**, **Month** and **Staff name or ID** to narrow the list.
- **Open PDF** opens a stored report. **Get PDF** creates one if it is missing.
- **Rebuild archive** creates stored PDFs for approved months that are missing from Drive. This can take several minutes.
- The archive folder opens from the link at the top of the card. Reports are stored as `Timesheet Reports / Year / Month`.

## 8. Resetting a month

Use this when an approved or submitted month must be reopened.

1. In **Report archive**, find the row and click **Reset**.
2. Enter a reason (at least 5 characters). The reason is required and is written to **ResetLog**.
3. Confirm. The approval record is removed, the stored PDF goes to Drive's Trash, and the staff member is notified.
4. The staff member can then edit and resubmit.

Reset only what you intend to. It also removes any resubmission for that month.

## 9. Export approved

In **Operations**, choose a month and year and click **Export approved**. The app creates a tab named like `Export_2026_09` in the Sheet. It lists every employee whose latest status is Approved, with allocated, leave share, adjusted, actual, variance and flag for each project.

## 10. Good practice

- Do not edit the Approvals or ReportIndex tabs by hand. Use Reset instead.
- Back up the Sheet and the Drive archive folder regularly (see [Deployment](../developer/deployment.md)).
- Check the **ResetLog** tab at the end of each month.
