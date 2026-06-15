import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Audit Log' }).click();
  await page.getByText('STATUS CHANGE').nth(1).click();
  await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Audit Log' }).click();
  await page.getByRole('button', { name: 'MR Mikhail Reveche subsystem' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Subsystem Admin · Academic' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Audit Log' }).click();
  await page.locator('div').filter({ hasText: /^DADr\. Ana Reyessubsystem admin$/ }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
});
