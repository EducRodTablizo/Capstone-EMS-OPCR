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
  5  |   await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  6  |   await page.getByRole('button', { name: 'Sign in' }).click();
  7  |   await page.getByRole('button', { name: 'MR Mikhail Reveche subsystem' }).click();
  8  |   await page.getByRole('button', { name: 'Logout' }).click();
  9  |   await page.getByRole('button', { name: 'Confirm' }).click();
  10 |   await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  11 |   await page.getByRole('button', { name: 'Sign in' }).click();
  12 |   await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
  13 |   await page.getByRole('link', { name: 'Transactions' }).click();
  14 |   await expect(page.getByRole('link', { name: 'View' }).nth(1)).toBeVisible();
  15 |   await page.getByRole('link', { name: 'View' }).nth(1).click();
  16 |   await expect(page.getByRole('button', { name: 'Mark Completed' })).toBeVisible();
  17 |   await page.getByRole('button', { name: 'Mark Completed' }).click();
  18 |   await page.getByRole('button', { name: 'Confirm' }).click();
  19 | });
```