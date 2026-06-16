# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module2.submodule_3.test.ts >> test
- Location: tests\module2.submodule_3.test.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('link', { name: 'View' }).nth(1)
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('link', { name: 'View' }).nth(1)

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
    - button "OPCR"
    - link "Evaluation Period":
      - /url: /sla-review
    - link "Transactions":
      - /url: /transactions
    - text: INSIGHTS
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
  - button "KY Kenneth Yulip staff":
    - text: KY
    - paragraph: Kenneth Yulip
    - paragraph: staff
  - heading "Service Transactions" [level=2]
  - text: Administrative Office
  - paragraph: Office-scoped view — only transactions from Administrative Office are visible.
  - textbox "Search transactions..."
  - combobox: All Status
  - button "New Transaction"
  - paragraph: Showing 0 of 0 transactions
- region "Notifications (F8)":
  - list
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('test', async ({ page }) => {
  4  |   await page.goto('http://localhost:5175/login');
  5  |   await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  6  |   await page.getByRole('button', { name: 'Sign in' }).click();
  7  |   await page.getByRole('button', { name: 'MR Mikhail Reveche subsystem' }).click();
  8  |   await page.getByRole('button', { name: 'Logout' }).click();
  9  |   await page.getByRole('button', { name: 'Confirm' }).click();
  10 |   await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  11 |   await page.getByRole('button', { name: 'Sign in' }).click();
  12 |   await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
  13 |   await page.getByRole('link', { name: 'Transactions' }).click();
> 14 |   await expect(page.getByRole('link', { name: 'View' }).nth(1)).toBeVisible();
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  15 |   await page.getByRole('link', { name: 'View' }).nth(1).click();
  16 |   await expect(page.getByRole('button', { name: 'Mark Completed' })).toBeVisible();
  17 |   await page.getByRole('button', { name: 'Mark Completed' }).click();
  18 |   await page.getByRole('button', { name: 'Confirm' }).click();
  19 | });
```