# Runbook 10: Staff How-To

## Objective

Show a staff member, step by step, how to record leave and daily hours, submit a month, print the PDF and manage notifications.

---

## Before You Start

- Open the web app link and sign in with your Workspace account.
- If you see *Your account is not registered*, ask your administrator to add you to the Employees list.
- Use Chrome. Allow pop-ups for the app, because PDFs open in a new tab.

---

## The Screen at a Glance

![My month overview](screenshots/staff/01-my-month-overview.png)

| Area | What it shows |
|---|---|
| Header | Your name, email and role |
| Tabs | **My month** (always), **My team** (managers), **Admin** (administrators) |
| Month bar | **‹ Previous**, the month shown, **Next ›** |
| Status bar | Your status, **Submit for approval**, **Print / Download PDF** |
| Summary line | Allocated hours, total leave, and the number of projects needing review |
| Summary table | One row per project: Allocated, Share, Leave share, Adjusted, Actual, Flag |
| 1. Leave | Add and remove leave, and see holidays |
| 2. Daily actual hours | The day-by-day grid for each project |
| 3. Email notifications | Your email preferences |

---

## Task 1: Move Between Months

1. Click **‹ Previous** or **Next ›**.
2. The month name in the middle changes, and every section reloads for that month.

Work on the month you need before moving on. Each month has its own status.

---

## Task 2: Add Leave

![Leave form](screenshots/staff/02-leave-form.png)

1. In **1. Leave**, set **From** to the first day.
2. Set **To** to the last day. For a single day, use the same date for both.
3. Choose the leave type: **Annual**, **Sick**, **Casual** or **Other**.
4. Choose **Full day (8 h)** or **Half day (4 h)**.
5. Click **Add leave**.

What happens next:

- Friday and Saturday are skipped automatically.
- The message shows how many days were added.
- If any day in the range would go over 8 h, the whole entry is rejected and the dates are listed. Nothing is saved, so change the dates or the duration and try again.

### Removing leave

Click **Delete** on the leave row. Confirm the prompt. Deleting is allowed only while the month is editable.

### Holidays

Public and government holidays appear in the same list with the type **Holiday** and 8 h. You cannot delete them. A holiday day cannot take other leave, because it is already counted.

![Holiday row](screenshots/staff/03-leave-holiday-row.png)

---

## Task 3: Enter Daily Hours

![Daily hours grid](screenshots/staff/04-daily-hours-grid.png)

Each row is one day. Each project column takes the hours for that project on that day.

| Cell | Meaning |
|---|---|
| Blank input | You can type hours here |
| Grey cell | Locked: weekend, full-day leave or holiday |
| Yellow cell | Leave recorded that day (read-only) |
| "(max 4 h)" beside the day | Half-day leave: only 4 h is available |
| Work total | Hours you entered for the day |

Steps:

1. Type the hours for a project on a day, for example `8`.
2. Press Tab to move on.
3. Repeat for each day and project.

If you type more than the day allows, a popup appears and the value is reduced to the maximum. The day's total turns red when it is over the limit.

### Matching the targets

The bottom three rows show the check:

| Row | Meaning |
|---|---|
| Target (adjusted) | How many hours each project should have after leave |
| Entered | How many hours you have typed for each project |
| Difference | Entered minus Target. Must be 0.00. |

![Matched grid](screenshots/staff/06-grid-matched.png)

When every project's Difference is 0.00 (green) and the month total matches, the message at the bottom reads *All projects and the month total match the target*.

Click **Save actual hours**. If something does not match, the message names the project and the amount.

---

## Task 4: Submit for Approval

![Submit for approval](screenshots/staff/07-submit-for-approval.png)

1. Confirm the grid is saved and every Difference is 0.00.
2. In the status bar, click **Submit for approval**.
3. Confirm the prompt.

After submitting:

- The status shows **Submitted, waiting for manager**.
- The hours and leave lock, and the grid is greyed out. You cannot edit them.
- Your manager receives an email if they have notifications on.

![Submitted and locked](screenshots/staff/08-status-submitted-locked.png)

### If the manager returns the month

- The status shows **Returned for correction**, with the manager's comment.
- Editing unlocks. Correct the hours, click **Save actual hours**, then **Submit for approval** again.

![Returned with comment](screenshots/staff/09-status-returned-comment.png)

---

## Task 5: Print or Download the PDF

![PDF opened in a new tab](screenshots/staff/10-print-download-pdf.png)

1. Click **Print / Download PDF** in the status bar or in the approval area.
2. Wait a few seconds. A line appears with two links.
3. Click **Open PDF** to view it in a new tab. Use the print icon in the PDF viewer to print.
4. Click **Download** to save a copy to your computer.

| PDF | When |
|---|---|
| Draft | The month is not yet approved. It is marked *not yet approved* and has blank signature boxes for manual signing. |
| Approved | The month is approved. It shows the digital approval record and the document reference. |

You cannot print directly from the web page. Chrome blocks it, so always print from the PDF tab.

---

## Task 6: Choose Your Email Notifications

![Email preferences](screenshots/staff/11-email-preferences.png)

1. Scroll to **3. Email notifications**.
2. Switch **Email notifications** ON or OFF. OFF stops all emails.
3. Tick the emails you want:
   - **Decision**: when your timesheet is approved or returned
   - **Holiday**: when a public or government holiday is added
4. Click **Save preferences**.

Managers also see options for *a team member submits* and *a team member adds leave*.

---

## Quick Checklist for Each Month

1. Add all leave for the month.
2. Enter daily hours until the Difference row shows 0.00.
3. Click **Save actual hours**.
4. Click **Submit for approval**.
5. When approved, click **Print / Download PDF** and keep a copy.

---

## Common Problems

See [Runbook 09: Troubleshooting](09-troubleshooting.md). The most common are *Not matched yet*, *Daily limit reached* and *Leave cannot be changed*.
