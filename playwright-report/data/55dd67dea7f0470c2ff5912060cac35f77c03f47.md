# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module4.submodule_3.test.ts >> test
- Location: tests\module4.submodule_3.test.ts:3:1

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
  7  |   await page.getByRole('link', { name: 'Audit Log' }).click();
  8  |   await page.getByText('STATUS CHANGE').nth(1).click();
  9  |   await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  10 |   await page.getByRole('button', { name: 'Logout' }).click();
  11 |   await page.getByRole('button', { name: 'Confirm' }).click();
  12 |   await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  13 |   await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  14 |   await page.getByRole('button', { name: 'Sign in' }).click();
  15 |   await page.getByRole('link', { name: 'Audit Log' }).click();
  16 |   await page.getByRole('button', { name: 'MR Mikhail Reveche subsystem' }).click();
  17 |   await page.getByRole('button', { name: 'Logout' }).click();
  18 |   await page.getByRole('button', { name: 'Confirm' }).click();
  19 |   await page.getByRole('button', { name: 'Subsystem Admin · Academic' }).click();
  20 |   await page.getByRole('button', { name: 'Sign in' }).click();
  21 |   await page.getByRole('link', { name: 'Audit Log' }).click();
  22 |   await page.locator('div').filter({ hasText: /^DADr\. Ana Reyessubsystem admin$/ }).click();
  23 |   await page.getByRole('button', { name: 'Logout' }).click();
  24 |   await page.getByRole('button', { name: 'Confirm' }).click();
  25 | });
  26 | 
```