import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'KY Kenneth Yulip staff' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('DashboardOverview — OSASTotal')).toBeVisible();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await expect(page.locator('div').filter({ hasText: 'Service' }).nth(4)).toBeVisible();
});