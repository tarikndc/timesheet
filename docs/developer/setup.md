# Setup

## Prerequisites

- A Google Workspace account with permission to create Google Sheets, Apps Script projects and Drive folders.
- Access to Gmail for notifications (granted through the manifest).
- Optional: Node.js and [clasp](https://github.com/google/clasp) to push files from your computer.

## 1. Create the data store

1. Create a new Google Sheet, for example "Timesheet Data".
2. Copy its ID from the URL: the text between `/d/` and `/edit`.

## 2. Create the archive folder

1. In Google Drive, create a folder named "Timesheet Reports".
2. Copy its ID from the folder URL (the text after `/folders/`).

Year and month sub-folders are created automatically.

## 3. Create the Apps Script project

Option A, in the browser:

1. In the Sheet, go to **Extensions → Apps Script**.
2. For each file in `src/`, click **+** in the Files list, choose **Script** (or **HTML** for `Index.html`), and paste the contents. Name it without the extension, for example `Code`.
3. Replace the default `appsscript.json` contents with the file from `src/`. To see that file, open **Project Settings** and tick **Show "appsscript.json" manifest file in editor**.

Option B, with clasp:

```bash
npm install -g @google/clasp
clasp login
cp .clasp.json.example .clasp.json   # then put your script ID in it
clasp push
```

## 4. Replace the placeholders

Search the project for `REPLACE_WITH` and fill in each value:

| Placeholder | File | Value |
|---|---|---|
| `REPLACE_WITH_SHEET_ID` | `Code.gs` | Sheet ID from step 1 |
| `REPLACE_WITH_REPORT_FOLDER_ID` | `Report.gs`, `Archive.gs`, and the archive link in `Index.html` | Folder ID from step 2 |
| `REPLACE_WITH_SIGNATURE_FILE_ID` | `Report.gs` | Drive ID of the signature image, or delete the signature feature |

Do not leave any placeholder in place. The app will fail when it opens the Sheet.

## 5. Create the tabs

1. In the editor, choose `setupWorkbook` from the function list and click **Run**.
2. Approve the permissions when asked, including Gmail, Drive and external requests.
3. Check the Sheet: the tabs and headers should now exist.

`setupWorkbook` only adds missing tabs and headers. It is safe to run again.

## 6. Set the first administrator

1. Open the **Settings** tab.
2. In `AdminEmails`, enter your Workspace address.
3. Add an **Employees** row for yourself so you can also use the staff views.

## 7. Deploy the web app

1. Click **Deploy → New deployment**.
2. Choose type **Web app**.
3. Execute as: **Me**. Who has access: **Anyone within your organisation**.
4. Click **Deploy** and approve the permissions.
5. Open the web app URL and sign in.

To update later, use **Deploy → Manage deployments → pencil icon → New version → Deploy**. The URL stays the same.

## 8. Test with each role

- Sign in as an admin: the Admin tab appears.
- Sign in as a manager: the My team tab appears.
- Sign in as staff: only My month appears.

## Troubleshooting

| Error | Likely cause |
|---|---|
| `Missing tab: X` | Run `setupWorkbook` |
| `Your account is not registered` | The address is not in Employees with Active = TRUE |
| `Exception: Specified permissions are not sufficient` | Re-authorise: remove the app from myaccount.google.com/permissions, run a function, approve again |
| `Illegal spreadsheet id` | SHEET_ID contains a URL or a placeholder. Use the ID only. |
| `ReferenceError: X is not defined` | A file is missing or a function was pasted in the wrong file. Compare with `src/`. |
| `blob was too large` | An image in the PDF is too big. Use a file under 2 MB and about 400 px wide. |

## Keeping src/ in step with the live project

The live Apps Script project is the source of truth. Before committing:

1. Copy the current code from the live project into `src/` (`clasp pull` into a temporary folder, or copy each file from the editor).
2. Run `python3 scripts/sanitize.py` to replace live IDs with placeholders.
3. Check the output for any "CHECK by hand" lines and remove them.
4. Commit only after the placeholders are in place.
