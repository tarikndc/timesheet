# Runbook 03: Staff Operations

## Objective

Record leave and daily project hours for each month, submit the month for approval, and obtain the PDF.

---

## Prerequisites

- An active row in the Employees tab with your Workspace address
- A monthly allocation set by your administrator

---

## Implementation Details

### 1. Open My month

Sign in to the web app. The **My month** tab opens for the current month. Use **Previous** and **Next** to move between months.

The summary line shows allocated hours, total leave and the number of projects that need review. The table shows, for each project, the allocation, share, leave share, adjusted target, actual gap and REVIEW flag. See [Runbook 06: Calculations](06-calculations.md).

### 2. Add leave

1. Choose a date, or a **From** and **To** range.
2. Choose the leave type: Annual, Sick, Casual or Other.
3. Choose **Full day (8 h)** or **Half day (4 h)**.
4. Click **Add leave**.

Friday and Saturday are skipped. Public and government holidays appear automatically and cannot be deleted. A holiday counts as 8 h, and leave on a holiday date is ignored.

If any day in a range would exceed 8 h, the whole entry is rejected and the dates are listed. Nothing is saved.

### 3. Enter daily hours

Each row is a day and each project column takes hours for that day.

- Grey cells are locked: weekends, full-day leave and holidays.
- A half-day leave day allows 4 h. The Day column shows `(max 4 h)`.
- Entering more than the day allows opens a popup and reduces the value.

Click **Save actual hours** when:

- every project's **Entered** total equals its **Target**, and
- the **Difference** row shows 0.00 for each project and the month total.

If the totals do not match, the message names the project and the difference.

### 4. Submit for approval

1. Confirm the Difference row is 0.00.
2. Click **Submit for approval**, then confirm.

The status changes to *Submitted* and hours and leave are locked. Your manager is notified if notifications are on.

If the manager returns the month, the status shows *Returned for correction* with their comment. Correct the hours, save, and submit again.

### 5. Print or download the PDF

Click **Print / Download PDF**. A line appears with **Open PDF** and **Download**.

- **Open PDF** opens a new tab. Print from the PDF viewer's print icon.
- Before approval, the PDF is a draft marked for manual signature.
- After approval, the PDF includes the digital approval record and document reference.

### 6. Set email notifications

Under **3. Email notifications**, switch the master switch on or off, then tick the emails you want. Click **Save preferences**.

---

## Step-by-Step Usage

For screen-by-screen instructions with screenshots, see [10-staff How-To](10-staff-how-to-use.md).

---

## Verification

- Difference row shows 0.00 for every project and the total, in green.
- After submission, the status shows *Submitted* and the grid is locked.
- The PDF opens in a new tab with the month, the status and the approval record.

---

## Troubleshooting

See [Runbook 09: Troubleshooting](09-troubleshooting.md).
