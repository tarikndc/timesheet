# Runbook 04: Manager Operations

## Objective

Review the timesheets of direct reports each month, and approve or return them with a comment.

---

## Prerequisites

- Employees tab rows whose `SupervisorEmail` is your Workspace address

---

## Implementation Details

### 1. Load the team

1. Open **My team**.
2. Choose the month and year.
3. Click **Load team**.

Each row shows allocated hours, leave, the number of projects needing review, and the status.

| Status | Meaning |
|---|---|
| Not submitted | The employee has not submitted the month |
| Submitted | Waiting for your decision |
| Approved | Approved and archived |
| Returned | Sent back for correction |

### 2. Review a month

Click **Review** on a row. The page shows the status line with the submission time, and the project table with targets, logged hours and actual gaps.

Investigate any project marked REVIEW (more than 2 h from its target) before deciding.

### 3. Approve or return

Approve and Return are enabled only when the status is **Submitted**.

- **Approve:** the month is locked as approved, the PDF is saved to the archive, and the employee is notified.
- **Return for correction:** the employee can edit and resubmit. Write a specific comment, because it appears on their page and in the email.

You can add an optional comment with either decision.

### 4. Print or download the report

Click **Print / Download PDF** under the review table. For approved months this opens the stored report. Otherwise it opens a draft.

### 5. Set notifications

Under **3. Email notifications**, you can receive emails when:

- an employee submits a timesheet
- an employee adds leave
- a decision you made, or a holiday, needs your attention

---

## Limits

- Managers cannot edit employee hours or leave.
- Managers cannot reset an approved month. Only an administrator can (see [Runbook 08](08-reset-and-recovery.md)).

---

## Verification

- After approval, the status changes to *Approved* and the report link works.
- The employee receives the decision email if their notifications are on.
