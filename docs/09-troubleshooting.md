# Runbook 09: Troubleshooting

## Objective

Identify and resolve common problems in the web app and the Apps Script project.

---

## Messages in the Web App

| Message or symptom | Cause | Action |
|---|---|---|
| Not matched yet | A project or the total differs from its target | Adjust hours until every Difference shows 0.00 |
| Daily limit reached | The day has less capacity because of leave | Reduce the hours for that day |
| Leave cannot be changed | The month is submitted or approved | Ask the manager to return it |
| Entry rejected, leave cannot exceed 8 h | A date in the range would be over 8 h | Choose a shorter range or different dates |
| Your account is not registered | The address is not in Employees with `Active` = TRUE | Ask the administrator to add or activate you |
| Hours disappeared from a day | The day is now leave or a holiday | Only visible hours are saved; check the leave list |
| PDF does not open | Pop-ups are blocked | Allow pop-ups for the web app and try again |
| Stuck on "Loading" | Stale page or slow response | Reload with Ctrl+Shift+R |

---

## Apps Script Errors

| Error | Cause | Action |
|---|---|---|
| `Missing tab: X` | Tab not created | Run `setupWorkbook` |
| `Illegal spreadsheet id` | `SHEET_ID` holds a URL or placeholder | Set the ID only |
| `ReferenceError: X is not defined` | Function missing or pasted in the wrong file | Compare the file with `src/` |
| `Specified permissions are not sufficient` | Scope not granted | Remove the app at myaccount.google.com/permissions, run a function, approve again |
| `blob was too large` | Image in the PDF is over 2 MB | Use a smaller image, about 400 px wide |
| `Could not find the file` for a PDF | Archive file was trashed | Use Get PDF to rebuild it |

---

## Procedure for Any New Error

1. Note the exact message and the file or function named in it.
2. Open **Executions** in the Apps Script editor and read the failed run.
3. Check that the same file exists in `src/` with the same name.
4. Record the fix in `CHANGELOG.md` once resolved.
