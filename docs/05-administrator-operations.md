# Runbook 05: Administrator Operations

## Objective

Maintain employees, projects, allocations, holidays and administrators, and manage the report archive and exports.

---

## Prerequisites

- Your address is listed in `AdminEmails` on the Settings tab
- You have completed [Runbook 01](01-application-setup.md)

---

## Implementation Details

### 1. Check settings

On the **Settings** tab, confirm:

- `AdminEmails` lists the administrator addresses, separated by commas
- `VarianceToleranceHours` is set (default 2)

### 2. Maintain employees

Each person needs a row in **Employees**.

| Column | Meaning |
|---|---|
| EmployeeID | Staff ID, for example `iDE0001` |
| EmployeeName | Full name |
| Email | Workspace address used to sign in |
| SupervisorEmail | Manager's address, blank if none |
| Active | TRUE or FALSE |

**Bulk upload:**

1. Under **Bulk employee upload**, click **Download sample CSV**.
2. Copy the sample from the box into Notepad, save as `employees.csv`, and edit it.
3. Choose the file and click **Upload employees CSV**.

Existing IDs are updated and new IDs are added. If any row fails, nothing is saved and each problem is listed by row number. The limit is 500 rows per file.

To remove access, set `Active` to FALSE. Records are kept.

### 3. Maintain projects

Add each project name to the **Projects** tab with `Active` = TRUE. A project must exist here before it can be allocated or logged.

### 4. Set monthly allocations

**One employee:**

1. In **Admin**, search for and select the employee.
2. Choose the year and click **Load year**.
3. Click **+ Add project** to add a column, then enter hours by month.
4. Click **Save allocation**. This replaces that employee's allocations for the year.

**Bulk CSV:** use the **Bulk allocation upload** card with the columns:

```
EmployeeID,Month,Year,ProjectName,AllocatedHours
```

Month is a full month name. ProjectName must exist in Projects. The file is validated first, and if any row is wrong nothing is saved. Each employee-month in the file is replaced. A sample is in `templates/allocations_sample.csv`.

### 5. Maintain holidays

Under **Public and government holidays**, add each date with a name and type. Each holiday counts as 8 h of leave for every employee and locks project hours that day. Friday and Saturday cannot be added.

### 6. Maintain administrators

Under **Admins**, add or remove addresses. You cannot remove yourself, and one administrator must remain.

### 7. Use the report archive

**Report archive** lists every submission, grouped by month.

- Filter by **Year**, **Month**, and **Staff name or ID**.
- **Open PDF** opens a stored report. **Get PDF** creates a missing one.
- **Rebuild archive** creates stored PDFs for approved months that are missing from Drive. It can take several minutes.
- The archive folder link at the top of the card opens `Timesheet Reports`.

### 8. Export approved months

In **Operations**, choose a month and year, then click **Export approved**. The app creates a tab such as `Export_2026_09` listing each approved employee with allocated, leave share, adjusted, actual, variance and flag per project.

### 9. Reset a month

See [Runbook 08: Reset and Recovery](08-reset-and-recovery.md).

---

## Step-by-Step Usage

For screen-by-screen instructions with screenshots, see [11-admin How-To](11-admin-how-to-use.md).

---

## Verification

- The employee appears in the staff list with the correct status.
- The archive shows the expected row for an approved month.
- The export tab lists only approved employees.

---

## Good Practice

- Do not edit the Approvals or ReportIndex tabs by hand. Use Reset.
- Check the ResetLog tab at the end of each month.
- Follow [Runbook 07: Backups and Housekeeping](07-backups-and-housekeeping.md).
