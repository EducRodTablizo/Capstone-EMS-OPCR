# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module4.submodule_2.test.ts >> test
- Location: tests\module4.submodule_2.test.ts:4:1

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
  1  | 
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test('test', async ({ page }) => {
> 5  |   await page.goto('http://localhost:5175/login');
     |              ^ Error: page.goto: Test timeout of 30000ms exceeded.
  6  |   await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  7  |   await page.getByRole('button', { name: 'Sign in' }).click();
  8  |   await page.getByRole('link', { name: 'Transactions' }).click();
  9  |   await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  10 |   await page.getByRole('button', { name: 'Logout' }).click();
  11 |   await page.getByRole('button', { name: 'Confirm' }).click();
  12 |   await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  13 |   await page.getByRole('button', { name: 'Sign in' }).click();
  14 |   await page.getByRole('link', { name: 'Transactions' }).click();
  15 |   await page.getByRole('button', { name: 'KY Kenneth Yulip staff' }).click();
  16 |   await page.getByRole('button', { name: 'Logout' }).click();
  17 |   await page.getByRole('button', { name: 'Confirm' }).click();
  18 |   await page.getByRole('button', { name: 'OPCR Evaluator · Cross-Office' }).click();
  19 |   await page.getByRole('button', { name: 'Sign in' }).click();
  20 |   await page.getByRole('link', { name: 'Transactions' }).click();
  21 |   await page.getByRole('button', { name: 'PC Pau Carillio opcr evaluator' }).click();
  22 |   await page.getByRole('button', { name: 'Logout' }).click();
  23 |   await page.getByRole('button', { name: 'Confirm' }).click();
  24 |   await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  25 |   await page.getByRole('button', { name: 'Sign in' }).click();
  26 |   await page.getByRole('link', { name: 'Transactions' }).click();
  27 |   await page.getByRole('button', { name: 'MR Mikhail Reveche subsystem' }).click();
  28 |   await page.getByRole('button', { name: 'Logout' }).click();
  29 |   await page.getByRole('button', { name: 'Confirm' }).click();
  30 |   await page.getByRole('button', { name: 'Subsystem Admin · Academic' }).click();
  31 |   await page.getByRole('button', { name: 'Sign in' }).click();
  32 |   await page.getByRole('link', { name: 'Transactions' }).click();
  33 |   await page.getByRole('button', { name: 'DA Dr. Ana Reyes subsystem' }).click();
  34 |   await page.getByRole('button', { name: 'Logout' }).click();
  35 |   await page.getByRole('button', { name: 'Confirm' }).click();
  36 |   await page.getByRole('button', { name: 'Staff · Academic Office' }).click();
  37 |   await page.getByRole('button', { name: 'Sign in' }).click();
  38 |   await page.getByRole('link', { name: 'Transactions' }).click();
  39 |   await page.getByRole('button', { name: 'BS Ben Santos staff' }).click();
  40 |   await page.getByRole('button', { name: 'Logout' }).click();
  41 |   await page.getByRole('button', { name: 'Confirm' }).click();
  42 | });
```