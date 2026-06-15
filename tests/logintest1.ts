/*import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});*/

import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5175/login');
  await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Dashboard' }).click();
  await page.getByRole('link', { name: 'Users' }).click();
  await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.locator('div').filter({ hasText: 'Service' }).nth(4).click();
  await page.getByRole('cell', { name: 'View' }).first().click();
  await page.getByRole('button', { name: 'KY Kenneth Yulip staff' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('link', { name: 'Transactions' }).click();
  await page.getByRole('button', { name: 'New Transaction' }).click();
  await page.getByRole('combobox').filter({ hasText: 'Select a service…' }).click();
  await page.getByLabel('Emergency Medical Consultation — WITH REFERRALMedical').getByText('Emergency Medical Consultation — WITH REFERRAL').click();
  await page.getByRole('combobox').filter({ hasText: 'Unassigned' }).click();
  await page.getByRole('option', { name: 'Paolo Ramos' }).click();
  await page.getByRole('textbox', { name: 'First Name' }).click();
  await page.getByRole('textbox', { name: 'First Name' }).fill('Rod ');
  await page.getByRole('textbox', { name: 'Middle Name (Optional)' }).click();
  await page.getByRole('textbox', { name: 'Surname' }).click();
  await page.getByRole('textbox', { name: 'Surname' }).fill('Tablizo');
  await page.getByRole('textbox', { name: 'First Name' }).click();
  await page.getByRole('textbox', { name: 'First Name' }).fill('Rodbenedict');
  await page.getByRole('textbox', { name: 'e.g., BSIT (BS Information' }).click();
  await page.getByRole('textbox', { name: 'e.g., BSIT (BS Information' }).fill('BSIT 3-2');
  await page.getByRole('combobox').filter({ hasText: 'Select year level' }).click();
  await page.getByRole('option', { name: '3rd Year' }).click();
  await page.getByRole('textbox', { name: 'e.g., BSIT (BS Information' }).click();
  await page.getByRole('textbox', { name: 'e.g., BSIT (BS Information' }).fill('BSIT');
  await page.getByRole('textbox', { name: '09XXXXXXXXX' }).click();
  await page.getByRole('textbox', { name: '09XXXXXXXXX' }).fill('09524652365');
  await page.locator('input[type="text"]').nth(1).click();
  await page.locator('input[type="text"]').nth(1).fill('Administration');
  await page.getByRole('combobox').filter({ hasText: 'Select an option' }).click();
  await page.getByRole('option', { name: 'Minor' }).click();
  await page.getByRole('button', { name: 'Submit Transaction' }).click();
  await page.locator('textarea').nth(1).click();
  await page.locator('textarea').nth(1).fill('Cold and HIgh Fever Oatient');
  await page.locator('textarea').nth(1).press('ArrowLeft');
  await page.getByText('Cold and HIgh Fever Oatient').press('ArrowLeft');
  await page.getByText('Cold and HIgh Fever Oatient').press('ArrowLeft');
  await page.getByText('Cold and HIgh Fever Oatient').press('ArrowLeft');
  await page.getByText('Cold and HIgh Fever Oatient').press('ArrowRight');
  await page.getByText('Cold and HIgh Fever Oatient').fill('Cold and HIgh Fever patient');
  await page.getByText('Cold and HIgh Fever Oatient').press('ArrowLeft');
  await page.getByText('Cold and HIgh Fever Oatient').fill('Cold and High Fever patient');
  await page.getByText('Cold and HIgh Fever Oatient').press('ArrowRight');
  await page.getByText('Cold and HIgh Fever Oatient').fill('Cough and High Fever patient');
  await page.locator('input[type="text"]').nth(2).fill('General Hospital');
  await expect(page.getByRole('main')).toMatchAriaSnapshot(`- button "Mark In Progress"`);
});
