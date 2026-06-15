/* import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('link', { name: 'View' }).nth(1).click();
  await expect(page.getByText('CompleteUpdate')).toBeVisible();
  await page.getByRole('button', { name: 'Mark Completed' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.locator('div:nth-child(2) > .text-card-foreground.rounded-xl.border.border-border > .p-6.pt-4')).toBeVisible();
  await page.getByRole('link', { name: 'Audit Log' }).click();
  await expect(page.getByRole('cell', { name: 'Jun 15, 2026, 02:29 PM' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'STATUS CHANGE' }).nth(1)).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Emergency Medical' }).nth(1)).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Non-Emergency Medical' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'John Michael Garcia' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'in_progress→completed' }).first()).toBeVisible();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('link', { name: 'View' }).nth(1).click();
  await expect(page.locator('div').filter({ hasText: /^This transaction is completed and is now read-only\.$/ })).toBeVisible();
  await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'OPCR Evaluator · Cross-Office' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions8In Progress12')).toBeVisible();
  await page.getByRole('link', { name: 'Audit Log' }).click();
  await expect(page.getByRole('button', { name: 'Date Range' })).toBeVisible();
  await page.getByRole('button', { name: 'Date Range' }).click();
  await page.getByRole('combobox').click();
  await expect(page.getByRole('combobox')).toBeVisible();
  await page.getByRole('combobox').click();
  await expect(page.getByText('FromTo')).toBeVisible();
}); */

