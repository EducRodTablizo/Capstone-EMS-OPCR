import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link').click();
  await page.getByRole('link', { name: 'Back to Transaction' }).click();
  await page.getByRole('button', { name: 'New Transaction' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Select a service…' }).click();
  await page.getByText('Campus Equipment / Materials Borrowing', { exact: true }).click();
  await page.getByRole('textbox', { name: 'First Name' }).click();
  await page.getByRole('textbox', { name: 'First Name' }).fill('Rodbenedict ');
  await page.getByRole('textbox', { name: 'Surname' }).click();
  await page.getByRole('textbox', { name: 'Surname' }).fill('Tablizo');
  await page.getByRole('textbox', { name: 'e.g., BSIT (BS Information' }).click();
  await page.getByRole('textbox', { name: 'e.g., BSIT (BS Information' }).fill('BSIT');
  await page.getByRole('textbox', { name: '09XXXXXXXXX' }).click();
  await page.getByRole('textbox', { name: '09XXXXXXXXX' }).fill('09554545485');
  await page.getByRole('button', { name: 'Submit Transaction' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Back to TransactionService')).toBeVisible();
  await expect(page.getByText('PendingIn ProgressCompletedCurrent Status:PendingRemarks for status change (')).toBeVisible();
});