import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link').click();
  await page.getByRole('complementary').getByRole('link', { name: 'Transactions' }).click();
  await expect(page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link')).toBeVisible();
  await page.getByRole('button', { name: 'KY Kenneth Yulip staff' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'OPCR Evaluator · Cross-Office' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await expect(page.getByRole('link', { name: 'View' }).first()).toBeVisible();
  await page.getByRole('link', { name: 'View' }).first().click();
});