import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Subsystem Admin (Admin Office' }).dblclick();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('link', { name: 'View' }).nth(3).click();
  await expect(page.getByText('Completed').nth(2)).toBeVisible();
  await expect(page.getByText('This transaction is completed')).toBeVisible();
});