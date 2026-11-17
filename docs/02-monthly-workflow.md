# Runbook 02: Monthly Workflow

## Objective

Describe the monthly cycle from allocation to approval and archive, with the status rules that apply at each step.

---

## Process

```mermaid
flowchart TD
    A[Admin adds employees, projects and holidays] --> B[Admin sets monthly allocation]
    B --> C[Staff add leave; holidays appear automatically]
    C --> D[Staff enter daily project hours]
    D --> E{Each project Entered = Target<br/>and month total matches?}
    E -- No --> D
    E -- Yes --> F[Staff: Submit for approval]
    F --> G[Manager reviews in My team]
    G --> H{Decision}
    H -- Approve --> I[Approved: PDF stored in Drive]
    H -- Return with comment --> J[Returned]
    J --> D
    I --> K[Admin: archive search and export]
    I -. Admin reset with reason .-> L[Reopened for staff]
    L --> D
```

---

## Status Rules

```mermaid
stateDiagram-v2
    [*] --> NotSubmitted
    NotSubmitted --> Submitted: Staff submits (targets matched)
    Submitted --> Approved: Manager approves
    Submitted --> Returned: Manager returns with comment
    Returned --> Submitted: Staff resubmits
    Approved --> NotSubmitted: Admin reset (reason logged)
```

- **Editable:** Not submitted, Returned
- **Locked:** Submitted, Approved

---

## Approval Sequence

```mermaid
sequenceDiagram
    participant S as Staff
    participant W as Web app
    participant Sh as Google Sheet
    participant M as Manager
    participant D as Google Drive
    S->>W: Enter hours and leave
    W->>Sh: Save (rules checked on the server)
    S->>W: Submit for approval
    W->>Sh: Status = Submitted (editing locked)
    W-->>M: Email (if notifications are on)
    M->>W: Approve, or return with comment
    W->>Sh: Status = Approved or Returned
    W-->>S: Email (if notifications are on)
    W->>D: Store approved PDF in Year / Month folder
```

---

## Daily Rules

| Rule | Enforced on |
|---|---|
| Maximum 8 h per day, minus leave or holiday that day | Server and page |
| Friday and Saturday locked | Server and page |
| Full-day leave or holiday locks the day | Server and page |
| Half-day leave leaves 4 h open | Server and page |
| Each project's entered total equals its target | Server (on save) and page |
| Month total equals total target | Server (on save) and page |

---

## Next

- [Runbook 03: Staff Operations](03-staff-operations.md)
- [Runbook 04: Manager Operations](04-manager-operations.md)
- [Runbook 05: Administrator Operations](05-administrator-operations.md)
