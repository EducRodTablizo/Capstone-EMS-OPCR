import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'MR Mikhail Reveche subsystem' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await expect(page.getByRole('link', { name: 'View' }).nth(1)).toBeVisible();
  await page.getByRole('link', { name: 'View' }).nth(1).click();
  await expect(page.getByRole('button', { name: 'Mark Completed' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark Completed' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
});