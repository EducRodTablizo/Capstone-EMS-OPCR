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
Error: expect(locator).toBeVisible() failed

Locator: getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')

```

```yaml
- img "PUP Logo"
- heading "Evaluation &" [level=1]
- heading "Monitoring System" [level=1]
- paragraph: PUP Caloocan — OPCR Compliance Platform
- heading "Sign in to your account" [level=3]
- paragraph: Credentials are validated via the Administrative & Records Management System (ARMS)
- text: Email address
- textbox "Email address":
  - /placeholder: you@pup.edu.ph
  - text: staff@ems.ph
- text: Password
- textbox "Password":
  - /placeholder: ••••••••
  - text: staff123
- button
- button "Sign in"
- heading "Demo Accounts" [level=3]
- button "Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →":
  - paragraph: Subsystem Admin · Administrative Office
  - paragraph: admin@ems.ph / admin123
  - text: Use →
- button "Staff · Administrative Office staff@ems.ph / staff123 Use →":
  - paragraph: Staff · Administrative Office
  - paragraph: staff@ems.ph / staff123
  - text: Use →
- button "OPCR Evaluator · Cross-Office opcr@ems.ph / opcr123 Use →":
  - paragraph: OPCR Evaluator · Cross-Office
  - paragraph: opcr@ems.ph / opcr123
  - text: Use →
- button "Subsystem Admin · OSAS ebautista@pup.edu.ph / admin123 Use →":
  - paragraph: Subsystem Admin · OSAS
  - paragraph: ebautista@pup.edu.ph / admin123
  - text: Use →
- button "Subsystem Admin · Academic Office academic_admin@ems.ph / demo123 Use →":
  - paragraph: Subsystem Admin · Academic Office
  - paragraph: academic_admin@ems.ph / demo123
  - text: Use →
- button "Staff · Academic Office academic_staff@ems.ph / demo123 Use →":
  - paragraph: Staff · Academic Office
  - paragraph: academic_staff@ems.ph / demo123
  - text: Use →
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('test', async ({ page }) => {
  4  |   await page.goto('http://localhost:5175/login');
  5  |   await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  6  |   await page.getByRole('button', { name: 'Sign in' }).click();
  7  |   await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  8  |   await page.getByRole('button', { name: 'Logout' }).click();
  9  |   await page.getByRole('button', { name: 'Confirm' }).click();
  10 |   await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  11 |   await page.getByRole('button', { name: 'Sign in' }).click();
> 12 |   await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
     |                                                                                                             ^ Error: expect(locator).toBeVisible() failed
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