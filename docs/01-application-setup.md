# Runbook 01: Application Setup

## Objective

Create the data store, archive folder and Apps Script project for the Timesheet application, connect them, and publish the web app to the organisation.

---

## Prerequisites

- Google Workspace account with rights to create Google Sheets, Drive folders and Apps Script projects
- Node.js and clasp (optional, for pushing from a computer)
- This repository, with the `src/` folder

---

## Implementation Details

### 1. Create the data store

- **Sheet name:** `Timesheet Data`
- **Source:** new blank Google Sheet
- **Record:** copy the ID from the URL, the text between `/d/` and `/edit`

### 2. Create the archive folder

- **Folder name:** `Timesheet Reports`
- **Record:** copy the ID from the folder URL, the text after `/folders/`

Year and month sub-folders are created automatically when reports are archived.

### 3. Create the Apps Script project

Option A, in the browser:

1. From the Sheet, open **Extensions → Apps Script**.
2. For each file in `src/`, click **+** in the Files list, choose **Script** (or **HTML** for `Index.html`), and paste the contents. Use the file name without its extension.
3. Replace `appsscript.json` with the copy from `src/`. Open **Project Settings** and tick **Show "appsscript.json" manifest file in editor** to see it.

Option B, with clasp:

```bash
npm install -g @google/clasp
clasp login
cp .clasp.json.example .clasp.json
# edit .clasp.json and set scriptId to your project ID
clasp push
```

### 4. Replace the placeholders

Search each file for `REPLACE_WITH` and set the values:

| Placeholder | File | Value |
|---|---|---|
| `REPLACE_WITH_SHEET_ID` | `Code.gs` | Sheet ID |
| `REPLACE_WITH_REPORT_FOLDER_ID` | `Report.gs`, `Archive.gs`, `Index.html` | Folder ID |
| `REPLACE_WITH_SIGNATURE_FILE_ID` | `Report.gs` | Signature image ID, or remove the footer signature feature |

Leave no placeholder in place. The app stops with an error when it opens the Sheet.

### 5. Create the tabs and headers

1. In the editor, choose `setupWorkbook` from the function list and click **Run**.
2. Approve the permissions (Sheets, Drive, Gmail, external requests).
3. Confirm the Sheet now has the tabs listed in [Reference: Data model](reference/data-model.md).

`setupWorkbook` adds missing tabs and headers only. It is safe to run again.

### 6. Register the first administrator

1. Open the **Settings** tab.
2. Set `AdminEmails` to your Workspace address. Separate several addresses with commas.
3. Add yourself to the **Employees** tab with `Active` = TRUE so you can also use the staff views.

### 7. Deploy the web app

1. **Deploy → New deployment**, type **Web app**.
2. Execute as **Me**. Who has access: **Anyone within your organisation**.
3. Click **Deploy**, approve the permissions, and copy the web app URL.

---

## Verification

- Open the web app URL while signed in as the administrator.
- The header shows your name, email and role `admin`.
- The **Admin** tab is visible.

---

## Keeping `src/` in step with the live project

The live Apps Script project is the source of truth. Before committing a change:

1. Run the sync script from the repository root. It pulls the live project into a temporary folder, copies the files into `src/`, and removes live IDs:

```bash
SCRIPT_ID=your_apps_script_project_id ./scripts/sync-from-live.sh
```

2. Check the output for any `CHECK by hand` line and resolve it.
3. Review the changes with `git diff` before committing.

---

## Next

[Runbook 02: Monthly Workflow](02-monthly-workflow.md)
