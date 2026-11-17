# Staff guide

## 1. Signing in

Open the web app link and sign in with your Google Workspace account. Use the same address your administrator registered. If you see "Your account is not registered", contact your administrator.

## 2. My month

The **My month** tab opens for the current month.

- **Previous** and **Next** move between months.
- The summary line shows allocated hours, total leave and how many projects need review.
- The table shows, for each project: allocated hours, share, leave share, adjusted target, actual, and a REVIEW flag when the gap is more than 2 h.

See [How the calculation works](../developer/calculations.md) for the formulas.

## 3. Adding leave

1. Choose a single date, or a **From** and **To** range.
2. Choose the leave type (Annual, Sick, Casual, Other).
3. Choose **Full day (8 h)** or **Half day (4 h)**.
4. Click **Add leave**.

Friday and Saturday are skipped. Public and government holidays appear in the list automatically and cannot be deleted by you. A holiday counts as 8 h, and leave on a holiday date is ignored so it is not counted twice.

If a range includes a day that would go over 8 h, the whole entry is rejected and the message lists the dates. Nothing is saved.

## 4. Daily actual hours

Each row is a day. Each project column accepts hours for that day.

- Grey cells are locked: weekends, full-day leave and holidays.
- On a half-day leave day, only 4 h can be entered. The Day column shows "(max 4 h)".
- No day can exceed its maximum. Entering too many hours opens a popup and the value is reduced.

The grid is ready to save when:

- every project's **Entered** total equals its **Target**, and
- the **Difference** row shows 0.00 in green for every project and for the month total.

Click **Save actual hours**. If the totals do not match, the message names the project and the difference.

## 5. Submitting for approval

When the grid matches, click **Submit for approval** and confirm. The status changes to *Submitted* and hours and leave are locked. Your manager is notified if notifications are on.

If your manager returns the month, the status shows *Returned for correction* with their comment. Correct the hours, save, and submit again.

## 6. Printing or downloading the PDF

Click **Print / Download PDF**. A line appears with **Open PDF** and **Download** links.

- **Open PDF** opens the timesheet in a new tab. Use the print icon in the PDF viewer to print it.
- For a month that is not yet approved, the PDF is a draft marked "not yet approved", for manual signature.
- For an approved month, the PDF includes the digital approval record and document reference.

## 7. Email notifications

Under **3. Email notifications**, switch the master switch on or off. Tick the emails you want:

- when your timesheet is approved or returned
- when a public or government holiday is added

Managers also see options for submissions and leave from their team.

## 8. Troubleshooting

| Message or symptom | What to do |
|---|---|
| "Not matched yet" | Adjust hours until each Difference shows 0.00. |
| "Daily limit reached" | The day has less capacity because of leave. Reduce the hours for that day. |
| "Leave cannot be changed" | The month is submitted or approved. Ask your manager to return it. |
| Leave you added shows an error | Check the message. A range is rejected if any single day would exceed 8 h. |
| Hours disappeared from a day | The day may now be leave or a holiday. Only the visible grid is saved. |
| PDF does not open | Allow pop-ups for the web app, or try again after a few seconds. |
| Blank page or "Loading" for a long time | Reload with Ctrl+Shift+R. If it continues, contact your administrator. |
