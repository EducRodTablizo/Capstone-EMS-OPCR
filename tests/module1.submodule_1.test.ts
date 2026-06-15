/*import { test, expect } from '@playwright/test';
// Module 1 Submodule 1-3 user management
test('test', async ({ page }) => {
    // submodule 1
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Users' }).click();
   // submodule 2 
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link').click();
  await page.getByRole('button', { name: 'KY Kenneth Yulip staff' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('opcr@ems.ph');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('opcr123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
   // submodule 3
  await page.getByRole('link', { name: 'View' }).first().click();
  await page.getByRole('button', { name: 'PC Pau Carillio opcr evaluator' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('ebautista@pup.edu.ph');
  await page.getByRole('textbox', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
});*/

import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
// submodule 1
  await page.goto('http://localhost:5175/login');
  await expect(page.locator('div').nth(1)).toBeVisible();
  await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
  await page.getByRole('link', { name: 'Users' }).click();
  await expect(page.getByText('User ManagementManage user accounts, roles, and permissions. Create UserARMS')).toBeVisible();
});