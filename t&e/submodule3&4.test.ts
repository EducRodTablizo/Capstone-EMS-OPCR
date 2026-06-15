import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).dblclick();
  await page.getByRole('link', { name: 'View' }).nth(1).click();
  await page.getByRole('button', { name: 'Mark Completed' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('link', { name: 'Back to Transaction' }).dblclick();
  await page.getByRole('link', { name: 'View' }).first().click();
  await page.getByRole('button', { name: 'For Compliance' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Incomplete' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Complete', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
});