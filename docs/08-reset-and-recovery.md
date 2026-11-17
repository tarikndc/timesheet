# Runbook 08: Reset and Recovery

## Objective

Reopen a submitted or approved month so the employee can correct it and resubmit, with a record of who did it and why.

---

## Prerequisites

- Administrator access
- A written reason for the reset

---

## Implementation Details

### 1. Find the month

Open **Admin → Report archive**. Filter by year, month or staff name, then locate the row.

### 2. Reset

1. Click **Reset** on the row.
2. Enter the reason, at least 5 characters. It is required.
3. Confirm.

### 3. What the reset does

1. Removes the month's approval records, so the status becomes *Not submitted*.
2. Reopens the saved hours: web entries become *Submitted* and email entries become *Pending Review*.
3. Moves the archived PDF to Drive's Trash and removes its index row.
4. Writes a line to **ResetLog** with the admin, employee, month, previous status and reason.
5. Emails the employee that the timesheet was reopened.

Only administrators can reset. Managers cannot.

---

## Verification

- The row disappears from the archive.
- The employee's **My month** shows *Not submitted* and the hours are editable.
- **ResetLog** shows the new line with the reason.

---

## Recovery

- The PDF is in Drive's Trash for 30 days. Restore it from there if the reset was a mistake.
- The approval records cannot be restored by the app. Ask the manager to approve the month again after the employee resubmits.

---

## Limits

A reset also removes any resubmission for that month, so check that the month should be reopened before confirming.
