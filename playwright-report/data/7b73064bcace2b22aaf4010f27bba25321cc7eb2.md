# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module2.submodule_2.test.ts >> test
- Location: tests\module2.submodule_2.test.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Back to TransactionService')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Back to TransactionService')

```

```yaml
- complementary:
  - img "PUP Caloocan logo"
  - paragraph: PUP Caloocan
  - paragraph: OPCR System
  - navigation:
    - text: MAIN
    - link "Dashboard":
      - /url: /dashboard
    - button "User Management"
    - link "Users":
      - /url: /users
    - button "Roles"
    - button "Permissions"
    - button "OPCR"
    - link "Evaluation Period":
      - /url: /sla-review
    - link "Transactions":
      - /url: /transactions
    - text: INSIGHTS
    - button "Records"
    - link "Audit Log":
      - /url: /audit-log
    - button "Reports"
    - button "Analytics"
  - text: Evaluation and Monitoring System
- main:
  - button "Toggle Sidebar"
  - navigation:
    - link "Home":
      - /url: /dashboard
    - text: ">"
    - link "OPCR":
      - /url: /transactions
    - text: "> Transactions"
  - text: Jun 9, 2026 – Jun 10, 2026
  - button "Notifications"
  - button "JM John Michael Garcia subsystem admin":
    - text: JM
    - paragraph: John Michael Garcia
    - paragraph: subsystem admin
  - heading "Service Transactions" [level=2]
  - text: Administrative Office
  - paragraph: Office-scoped view — only transactions from Administrative Office are visible.
  - textbox "Search transactions..."
  - combobox: All Status
  - button "New Transaction"
  - paragraph: Showing 4 of 4 transactions
  - table:
    - rowgroup:
      - row "Service Client Time In Assigned To Status Documents SLA Duration":
        - columnheader "Service"
        - columnheader "Client"
        - columnheader "Time In"
        - columnheader "Assigned To"
        - columnheader "Status"
        - columnheader "Documents"
        - columnheader "SLA"
        - columnheader "Duration"
        - columnheader
    - rowgroup:
      - row "Facility Reservation Request Administrative BSIT Student Council Jun 15, 2026 5:10 PM Unassigned Pending Incomplete Pending — / 12m View":
        - cell "Facility Reservation Request Administrative":
          - paragraph: Facility Reservation Request
          - paragraph: Administrative
        - cell "BSIT Student Council"
        - cell "Jun 15, 2026 5:10 PM"
        - cell "Unassigned"
        - cell "Pending"
        - cell "Incomplete"
        - cell "Pending"
        - cell "— / 12m"
        - cell "View":
          - link "View":
            - /url: /transactions/txn-4
      - row "Non-Emergency Medical Consultation (New Patient) Medical Pedro Santos Jun 15, 2026 4:40 PM Jose Reyes In Progress Complete Pending — / 30m View":
        - cell "Non-Emergency Medical Consultation (New Patient) Medical":
          - paragraph: Non-Emergency Medical Consultation (New Patient)
          - paragraph: Medical
        - cell "Pedro Santos"
        - cell "Jun 15, 2026 4:40 PM"
        - cell "Jose Reyes"
        - cell "In Progress"
        - cell "Complete"
        - cell "Pending"
        - cell "— / 30m"
        - cell "View":
          - link "View":
            - /url: /transactions/txn-3
      - row "Emergency Medical Consultation — WITH REFERRAL Medical Juan dela Torre Jun 15, 2026 3:40 PM Jose Reyes Completed Complete Non-Compliant 31m / 22m View":
        - cell "Emergency Medical Consultation — WITH REFERRAL Medical":
          - paragraph: Emergency Medical Consultation — WITH REFERRAL
          - paragraph: Medical
        - cell "Juan dela Torre"
        - cell "Jun 15, 2026 3:40 PM"
        - cell "Jose Reyes"
        - cell "Completed"
        - cell "Complete"
        - cell "Non-Compliant"
        - cell "31m / 22m"
        - cell "View":
          - link "View":
            - /url: /transactions/txn-1
      - row "Medical Certificate — Sick Note / Excuse Slip Medical Maria Gomez Jun 15, 2026 2:40 PM Ana Cruz Completed Complete Compliant 6m / 8m View":
        - cell "Medical Certificate — Sick Note / Excuse Slip Medical":
          - paragraph: Medical Certificate — Sick Note / Excuse Slip
          - paragraph: Medical
        - cell "Maria Gomez"
        - cell "Jun 15, 2026 2:40 PM"
        - cell "Ana Cruz"
        - cell "Completed"
        - cell "Complete"
        - cell "Compliant"
        - cell "6m / 8m"
        - cell "View":
          - link "View":
            - /url: /transactions/txn-2
- region "Notifications (F8)":
  - list
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('test', async ({ page }) => {
  4  |   await page.goto('http://localhost:5175/login');
  5  |   await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  6  |   await page.getByRole('button', { name: 'Sign in' }).click();
  7  |   await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
  8  |   await page.getByRole('link', { name: 'Transactions' }).click();
  9  |   await page.getByRole('link', { name: 'View' }).first().click();
> 10 |   await expect(page.getByText('Back to TransactionService')).toBeVisible();
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  11 |   await page.getByRole('option', { name: 'Ryan Bill Donayre' }).click();
  12 |   await page.getByRole('button', { name: 'Confirm' }).click();
  13 |   await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  14 |   await page.getByRole('button', { name: 'Logout' }).click();
  15 |   await page.getByRole('button', { name: 'Confirm' }).click();
  16 |   await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  17 |   await page.getByRole('button', { name: 'Sign in' }).click();
  18 |   await expect(page.getByText('DashboardOverview — OSASTotal')).toBeVisible();
  19 |   await page.getByRole('link', { name: 'Transactions' }).click();
  20 |   await page.getByRole('link', { name: 'View' }).first().click();
  21 | });
```