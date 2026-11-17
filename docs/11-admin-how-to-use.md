# Runbook 11: Administrator How-To

## Objective

Show an administrator, step by step, how to set up employees, projects, allocations and holidays, manage administrators, search and reset the report archive, and export approved months.

---

## Before You Start

- Your address must be listed in **Settings → AdminEmails**.
- The **Admin** tab appears in the top navigation when you are signed in as an administrator.
- Have the employee list, project names and allocation plan ready.

---

## The Admin Tab at a Glance

![Employee list](screenshots/admin/01-employee-list-search.png)

The **Admin** tab has two columns:

| Column | Contents |
|---|---|
| Left | Search box and the employee list |
| Right | Report archive, allocation grid, holidays, admins, bulk uploads, operations |

---

## Task 1: Add or Update Employees

### One at a time

Employees are added by editing the **Employees** tab in the Google Sheet:

1. Open the Sheet and click the **Employees** tab.
2. Type one person per row: EmployeeID, EmployeeName, Email, SupervisorEmail, Active.
3. Set Active to `TRUE`. Use `FALSE` for people who have left.

### Many at once

![Bulk employee upload](screenshots/admin/03-bulk-employee-upload.png)

1. In **Bulk employee upload**, click **Download sample CSV**.
2. The sample appears in a box. Click inside it, press Ctrl+A then Ctrl+C.
3. Open Notepad, paste, and save the file as `employees.csv`.
4. Edit the rows. Keep the header row exactly as it is.
5. Click **Choose File** and select `employees.csv`.
6. Click **Upload employees CSV**.

Results:

- *Done. Added X, updated Y.* means the upload succeeded.
- A red message lists every row with a problem, such as `Row 7: Email is not valid`. Nothing is saved until the file is correct. Fix the rows and upload again.
- Existing EmployeeIDs are updated. New IDs are added.

---

## Task 2: Find an Employee

1. Type the name, ID or email in **Search name, ID or email**.
2. Click the employee in the list. The allocation card opens for that person.

---

## Task 3: Set Monthly Allocations

![Allocation grid](screenshots/admin/02-allocation-grid.png)

1. Select the employee.
2. Choose the year in the year box and click **Load year**.
3. Choose a project from the drop-down and click **+ Add project**.
4. Type the hours for each month under each project. The Total column and row update as you type.
5. Repeat for each project.
6. Click **Save allocation**.

Notes:

- Saving replaces this employee's allocations for the whole year.
- To remove a project column, click the **×** beside its name, then save.
- Projects must exist in the **Projects** tab first.

### Bulk allocations

![Bulk allocation upload](screenshots/admin/04-bulk-allocation-upload.png)

1. Prepare a CSV with these columns: `EmployeeID,Month,Year,ProjectName,AllocatedHours`.
2. Use full month names, for example `September`.
3. Click **Choose File**, select the file, then click **Upload**.

If any row is wrong, the message lists the rows and nothing is saved.

---

## Task 4: Add Holidays

![Holidays](screenshots/admin/05-holidays.png)

1. In **Public and government holidays**, choose the year.
2. Pick the **date**, type the **name**, choose **Public** or **Government**, and check the **hours** (8).
3. Click **Add holiday**.

Each holiday counts as 8 h of leave for every employee and locks project hours that day. Staff with the Holiday notice on receive an email. Use **Delete** in the table to remove a holiday.

Friday and Saturday cannot be added, because they are already weekends.

---

## Task 5: Manage Administrators

![Admins card](screenshots/admin/06-admins.png)

1. In **Admins**, type the email address in the box.
2. Click **Add admin**.
3. To remove an admin, click **Remove** beside their name.

You cannot remove yourself, and at least one administrator must remain. Your own address is labelled *(you)*.

---

## Task 6: Search the Report Archive

![Report archive](screenshots/admin/07-report-archive.png)

The archive lists every submitted and approved timesheet, grouped by month. The line above the table counts them by status.

1. Choose a **Year** and a **Month**, or leave them on *All*.
2. Type part of a name or an ID in **Staff name or ID**.
3. Click **Search**.

Each row shows the staff member, manager, status, dates and the PDF link.

| Button | What it does |
|---|---|
| **Open PDF** | Opens the stored report in a new tab |
| **Download** | Saves the stored report |
| **Get PDF** | Creates the report if it is missing (used for older rows) |
| **Reset** | Reopens the month (see Task 7) |

**Rebuild archive** creates stored PDFs for approved months that are missing from Drive. Use it after a migration. It can take several minutes.

The link **Open the archive folder in Google Drive** opens the `Timesheet Reports` folder, sorted by year and month.

---

## Task 7: Reset a Month

![Reset prompt](screenshots/admin/08-reset-timesheet.png)

Use this when a month must be reopened.

1. In **Report archive**, find the row and click **Reset**.
2. Type the reason, at least 5 characters, and click OK. The reason is required.
3. Confirm the second prompt.

The result message shows how many hour entries were reopened and the previous status. The employee receives an email and can edit and resubmit.

A reset removes the approval, moves the PDF to the Drive Trash, and writes a line to the **ResetLog** tab. See [Runbook 08](08-reset-and-recovery.md).

---

## Task 8: Export Approved Months

![Operations and export](screenshots/admin/09-export-approved.png)

1. In **Operations**, choose the month and enter the year.
2. Click **Export approved**.
3. Click **Open** in the message to view the new tab in the spreadsheet.

The export lists only employees whose latest status is *Approved*, one row per project, with allocated, leave share, adjusted, actual, variance and flag.

---

## Task 9: Check Settings

On the **Settings** tab in the Sheet:

| Setting | Use |
|---|---|
| AdminEmails | Administrator addresses, separated by commas |
| VarianceToleranceHours | Gap that triggers REVIEW (default 2) |

---

## Daily and Monthly Routine

**Daily or as needed**
- Add new employees and projects.
- Add holidays as they are announced.
- Use the archive to answer questions about a submission.

**End of each month**
1. Check that every employee has a status in **My team** or the archive.
2. Export approved months.
3. Check the **ResetLog** tab.
4. Follow [Runbook 07](07-backups-and-housekeeping.md).

---

## Common Problems

See [Runbook 09: Troubleshooting](09-troubleshooting.md).
