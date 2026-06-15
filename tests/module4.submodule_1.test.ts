import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('link', { name: 'View' }).first().click();
  await page.getByRole('link', { name: 'Back to Transaction' }).click();
  await page.getByRole('link', { name: 'View' }).first().click();
});