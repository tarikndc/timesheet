# Calculations

## Inputs

| Symbol | Meaning |
|---|---|
| A | Allocated hours for one project in the month (admin) |
| T | Total allocated hours for the month (all projects) |
| L | Total leave for the month, with each holiday counted as 8 h. Leave on a holiday date is ignored. |
| S | Share: A ÷ T |

## Formulas

| Value | Formula |
|---|---|
| Leave share | L × S |
| Adjusted (target) | A − leave share |
| Logged | Sum of saved hours for the project in the month, excluding rejected entries |
| Actual | \|Logged − Adjusted\| (shown without sign) |
| Difference (signed) | Logged − Adjusted (shown in the daily grid) |
| Flag | REVIEW when Actual is greater than the tolerance (default 2 h) |

## Worked example

Allocation: Project A 156 h, Project B 20 h, total 176 h. Leave: 28 h.

| | Project A | Project B | Total |
|---|---|---|---|
| Share | 156 ÷ 176 = 88.6% | 20 ÷ 176 = 11.4% | 100% |
| Leave share | 28 × 88.6% = 24.82 | 28 × 11.4% = 3.18 | 28.00 |
| Adjusted (target) | 156 − 24.82 = 131.18 | 20 − 3.18 = 16.82 | 148.00 |

If the logged hours are 138.27 and 17.73, the signed differences are +7.09 and +0.91. The Actual column shows 7.09 and 0.91, and the total shows 8.00.

## Rounding

Each project target is rounded to two decimals. The largest project absorbs any rounding difference, so the project targets always add up exactly to the month total.

## Daily cap

| Day type | Maximum project hours |
|---|---|
| Weekend (Friday, Saturday) | 0 |
| Full-day leave or holiday | 0 |
| Half-day leave | 4 |
| Otherwise | 8 |

## Matching rule for submission

A month can be submitted only when each project's logged total equals its target within 0.005 h, and the month total equals the total target within 0.005 h.
