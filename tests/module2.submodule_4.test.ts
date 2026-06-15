import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link').click();
  await page.getByRole('link', { name: 'Back to Transaction' }).click();
  await page.getByRole('link', { name: 'View' }).nth(1).click();
  await page.getByRole('button', { name: 'Incomplete' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'For Compliance' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Complete', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.locator('div:nth-child(2) > div:nth-child(2) > .p-6.pt-4')).toBeVisible();
});