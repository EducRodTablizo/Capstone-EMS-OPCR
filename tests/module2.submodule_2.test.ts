import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('link', { name: 'View' }).first().click();
  await expect(page.getByText('Back to TransactionService')).toBeVisible();
  await page.getByRole('option', { name: 'Ryan Bill Donayre' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('DashboardOverview — OSASTotal')).toBeVisible();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('link', { name: 'View' }).first().click();
});