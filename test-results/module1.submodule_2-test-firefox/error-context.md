# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module1.submodule_2.test.ts >> test
- Location: tests\module1.submodule_2.test.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:5175/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('test', async ({ page }) => {
> 4  |   await page.goto('http://localhost:5175/login');
     |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  5  |   await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  6  |   await page.getByRole('button', { name: 'Sign in' }).click();
  7  |   await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  8  |   await page.getByRole('button', { name: 'Logout' }).click();
  9  |   await page.getByRole('button', { name: 'Confirm' }).click();
  10 |   await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  11 |   await page.getByRole('button', { name: 'Sign in' }).click();
  12 |   await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
  13 |   await page.getByRole('link', { name: 'Transactions' }).click();
  14 |   await page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link').click();
  15 |   await page.getByRole('complementary').getByRole('link', { name: 'Transactions' }).click();
  16 |   await expect(page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link')).toBeVisible();
  17 |   await page.getByRole('button', { name: 'KY Kenneth Yulip staff' }).click();
  18 |   await page.getByRole('button', { name: 'Logout' }).click();
  19 |   await page.getByRole('button', { name: 'Confirm' }).click();
  20 |   await page.getByRole('button', { name: 'OPCR Evaluator · Cross-Office' }).click();
  21 |   await page.getByRole('button', { name: 'Sign in' }).click();
  22 |   await page.getByRole('link', { name: 'Transactions' }).click();
  23 |   await expect(page.getByRole('link', { name: 'View' }).first()).toBeVisible();
  24 |   await page.getByRole('link', { name: 'View' }).first().click();
  25 | });
```