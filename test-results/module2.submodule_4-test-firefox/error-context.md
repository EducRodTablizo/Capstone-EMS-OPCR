# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module2.submodule_4.test.ts >> test
- Location: tests\module2.submodule_4.test.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Target page, context or browser has been closed
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('test', async ({ page }) => {
  4  |   await page.goto('http://localhost:5175/login');
  5  |   await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
> 6  |   await page.getByRole('button', { name: 'Sign in' }).click();
     |                                                       ^ Error: locator.click: Target page, context or browser has been closed
  7  |   await page.getByRole('link', { name: 'Transactions' }).click();
  8  |   await page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link').click();
  9  |   await page.getByRole('link', { name: 'Back to Transaction' }).click();
  10 |   await page.getByRole('link', { name: 'View' }).nth(1).click();
  11 |   await page.getByRole('button', { name: 'Incomplete' }).click();
  12 |   await page.getByRole('button', { name: 'Confirm' }).click();
  13 |   await page.getByRole('button', { name: 'For Compliance' }).click();
  14 |   await page.getByRole('button', { name: 'Confirm' }).click();
  15 |   await page.getByRole('button', { name: 'Complete', exact: true }).click();
  16 |   await page.getByRole('button', { name: 'Confirm' }).click();
  17 |   await expect(page.locator('div:nth-child(2) > div:nth-child(2) > .p-6.pt-4')).toBeVisible();
  18 | });
```