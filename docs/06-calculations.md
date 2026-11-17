# Runbook 06: Calculations

## Objective

Explain how the adjusted target, the logged hours and the Actual gap are calculated, so that results can be checked by hand.

---

## Inputs

| Symbol | Meaning |
|---|---|
| A | Allocated hours for one project in the month |
| T | Total allocated hours for the month |
| L | Total leave for the month (holidays counted at 8 h; leave on a holiday date ignored) |
| S | Share = A ÷ T |

---

## Formulas

| Value | Formula |
|---|---|
| Leave share | L × S |
| Adjusted (target) | A − Leave share |
| Logged | Sum of saved hours for the project, excluding rejected entries |
| Difference (signed) | Logged − Adjusted (shown in the daily grid) |
| Actual | \|Difference\| (shown without sign in the summary) |
| Flag | REVIEW when Actual is greater than the tolerance (default 2 h) |

---

## Worked Example

Allocation: Project A 156 h, Project B 20 h, total 176 h. Leave 28 h.

| | Project A | Project B | Total |
|---|---|---|---|
| Share | 156 ÷ 176 = 88.6% | 20 ÷ 176 = 11.4% | 100% |
| Leave share | 28 × 88.6% = 24.82 | 28 × 11.4% = 3.18 | 28.00 |
| Adjusted target | 156 − 24.82 = 131.18 | 20 − 3.18 = 16.82 | 148.00 |

If logged hours are 138.27 and 17.73, the signed differences are +7.09 and +0.91. The summary shows Actual 7.09 and 0.91, and the total 8.00.

---

## Rounding

Each project target is rounded to two decimals. The largest project absorbs any rounding difference, so project targets always add up to the month total.

---

## Daily Cap

| Day type | Maximum project hours |
|---|---|
| Friday or Saturday | 0 |
| Full-day leave or holiday | 0 |
| Half-day leave | 4 |
| Otherwise | 8 |

---

## Submission Match

A month can be submitted only when each project's logged total equals its target within 0.005 h, and the month total equals the total target within 0.005 h.

---

## Verification

Recalculate one project by hand using the formulas above. Its adjusted target should match the Target row in the daily grid.
