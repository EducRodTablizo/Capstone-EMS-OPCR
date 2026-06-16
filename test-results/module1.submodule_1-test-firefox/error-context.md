# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module1.submodule_1.test.ts >> test
- Location: tests\module1.submodule_1.test.ts:40:1

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
  1  | /*import { test, expect } from '@playwright/test';
  2  | // Module 1 Submodule 1-3 user management
  3  | test('test', async ({ page }) => {
  4  |     // submodule 1
  5  |   await page.goto('http://localhost:5175/login');
  6  |   await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  7  |   await page.getByRole('button', { name: 'Sign in' }).click();
  8  |   await page.getByRole('link', { name: 'Users' }).click();
  9  |    // submodule 2 
  10 |   await page.getByRole('button', { name: 'Logout' }).click();
  11 |   await page.getByRole('button', { name: 'Confirm' }).click();
  12 |   await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  13 |   await page.getByRole('button', { name: 'Sign in' }).click();
  14 |   await page.getByRole('link', { name: 'Transactions' }).click();
  15 |   await page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link').click();
  16 |   await page.getByRole('button', { name: 'KY Kenneth Yulip staff' }).click();
  17 |   await page.getByRole('button', { name: 'Logout' }).click();
  18 |   await page.getByRole('button', { name: 'Confirm' }).click();
  19 |   await page.getByRole('textbox', { name: 'Email address' }).click();
  20 |   await page.getByRole('textbox', { name: 'Email address' }).fill('opcr@ems.ph');
  21 |   await page.getByRole('textbox', { name: 'Password' }).click();
  22 |   await page.getByRole('textbox', { name: 'Password' }).fill('opcr123');
  23 |   await page.getByRole('button', { name: 'Sign in' }).click();
  24 |   await page.getByRole('link', { name: 'Transactions' }).click();
  25 |    // submodule 3
  26 |   await page.getByRole('link', { name: 'View' }).first().click();
  27 |   await page.getByRole('button', { name: 'PC Pau Carillio opcr evaluator' }).click();
  28 |   await page.getByRole('button', { name: 'Logout' }).click();
  29 |   await page.getByRole('button', { name: 'Confirm' }).click();
  30 |   await page.getByRole('textbox', { name: 'Email address' }).click();
  31 |   await page.getByRole('textbox', { name: 'Email address' }).fill('ebautista@pup.edu.ph');
  32 |   await page.getByRole('textbox', { name: 'Password' }).click();
  33 |   await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  34 |   await page.getByRole('button', { name: 'Sign in' }).click();
  35 |   await page.getByRole('link', { name: 'Transactions' }).click();
  36 | });*/
  37 | 
  38 | import { test, expect } from '@playwright/test';
  39 | 
  40 | test('test', async ({ page }) => {
  41 | // submodule 1
> 42 |   await page.goto('http://localhost:5175/login');
     |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  43 |   await expect(page.locator('div').nth(1)).toBeVisible();
  44 |   await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  45 |   await page.getByRole('button', { name: 'Sign in' }).click();
  46 |   await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
  47 |   await page.getByRole('link', { name: 'Users' }).click();
  48 |   await expect(page.getByText('User ManagementManage user accounts, roles, and permissions. Create UserARMS')).toBeVisible();
  49 | });
```