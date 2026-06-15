import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'OPCR' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('link', { name: 'View' }).first().click();
  await page.getByRole('button', { name: 'Mark In Progress' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Complete', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Mark Completed' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('in_progress → completed')).toBeVisible();
  await page.getByRole('link', { name: 'Audit Log' }).click();
  await expect(page.getByText('in_progress→completed').first()).toBeVisible();
});