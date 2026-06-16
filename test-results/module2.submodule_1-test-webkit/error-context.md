# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module2.submodule_1.test.ts >> test
- Location: tests\module2.submodule_1.test.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Staff · Administrative Office' })
    - locator resolved to <button type="button" class="w-full flex items-center justify-between px-3 py-2 rounded-md text-left hover:bg-accent transition-colors group">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - element is outside of the viewport
    - retrying click action
      - waiting 100ms
    25 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - element is outside of the viewport
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic:
    - generic:
      - img "PUP Logo" [ref=e3]
      - heading "Evaluation &" [level=1]
      - heading "Monitoring System" [level=1]
      - paragraph: PUP Caloocan — OPCR Compliance Platform
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "Sign in to your account" [level=3]
        - paragraph: Credentials are validated via the Administrative & Records Management System (ARMS)
      - generic [ref=e6]:
        - generic:
          - generic:
            - text: Email address
            - textbox "Email address" [ref=e7]:
              - /placeholder: you@pup.edu.ph
          - generic:
            - text: Password
            - generic:
              - textbox "Password" [ref=e8]:
                - /placeholder: ••••••••
              - button [ref=e9] [cursor=pointer]:
                - img [ref=e10]
          - button "Sign in" [ref=e13] [cursor=pointer]
    - generic [ref=e14]:
      - generic [ref=e15]:
        - heading "Demo Accounts" [level=3]
      - generic [ref=e16]:
        - generic:
          - button "Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →" [ref=e17] [cursor=pointer]:
            - generic [ref=e18]:
              - paragraph [ref=e19]: Subsystem Admin · Administrative Office
              - paragraph [ref=e20]: admin@ems.ph / admin123
            - generic [ref=e21]: Use →
          - button "Staff · Administrative Office staff@ems.ph / staff123 Use →" [ref=e22] [cursor=pointer]:
            - generic [ref=e23]:
              - paragraph [ref=e24]: Staff · Administrative Office
              - paragraph [ref=e25]: staff@ems.ph / staff123
            - generic [ref=e26]: Use →
          - button "OPCR Evaluator · Cross-Office opcr@ems.ph / opcr123 Use →" [ref=e27] [cursor=pointer]:
            - generic [ref=e28]:
              - paragraph [ref=e29]: OPCR Evaluator · Cross-Office
              - paragraph [ref=e30]: opcr@ems.ph / opcr123
            - generic [ref=e31]: Use →
          - button "Subsystem Admin · OSAS ebautista@pup.edu.ph / admin123 Use →" [ref=e32] [cursor=pointer]:
            - generic [ref=e33]:
              - paragraph [ref=e34]: Subsystem Admin · OSAS
              - paragraph [ref=e35]: ebautista@pup.edu.ph / admin123
            - generic [ref=e36]: Use →
          - button "Subsystem Admin · Academic Office academic_admin@ems.ph / demo123 Use →" [ref=e37] [cursor=pointer]:
            - generic [ref=e38]:
              - paragraph [ref=e39]: Subsystem Admin · Academic Office
              - paragraph [ref=e40]: academic_admin@ems.ph / demo123
            - generic [ref=e41]: Use →
          - button "Staff · Academic Office academic_staff@ems.ph / demo123 Use →" [ref=e42] [cursor=pointer]:
            - generic [ref=e43]:
              - paragraph [ref=e44]: Staff · Academic Office
              - paragraph [ref=e45]: academic_staff@ems.ph / demo123
            - generic [ref=e46]: Use →
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('test', async ({ page }) => {
  4  |   await page.goto('http://localhost:5175/login');
> 5  |   await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
     |                                                                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
  6  |   await page.getByRole('button', { name: 'Sign in' }).click();
  7  |   await page.getByRole('link', { name: 'Transactions' }).click();
  8  |   await page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link').click();
  9  |   await page.getByRole('link', { name: 'Back to Transaction' }).click();
  10 |   await page.getByRole('button', { name: 'New Transaction' }).click();
  11 |   await page.getByRole('combobox').filter({ hasText: 'Select a service…' }).click();
  12 |   await page.getByText('Campus Equipment / Materials Borrowing', { exact: true }).click();
  13 |   await page.getByRole('textbox', { name: 'First Name' }).click();
  14 |   await page.getByRole('textbox', { name: 'First Name' }).fill('Rodbenedict ');
  15 |   await page.getByRole('textbox', { name: 'Surname' }).click();
  16 |   await page.getByRole('textbox', { name: 'Surname' }).fill('Tablizo');
  17 |   await page.getByRole('textbox', { name: 'e.g., BSIT (BS Information' }).click();
  18 |   await page.getByRole('textbox', { name: 'e.g., BSIT (BS Information' }).fill('BSIT');
  19 |   await page.getByRole('textbox', { name: '09XXXXXXXXX' }).click();
  20 |   await page.getByRole('textbox', { name: '09XXXXXXXXX' }).fill('09554545485');
  21 |   await page.getByRole('button', { name: 'Submit Transaction' }).click();
  22 |   await page.getByRole('button', { name: 'Confirm' }).click();
  23 |   await expect(page.getByText('Back to TransactionService')).toBeVisible();
  24 |   await expect(page.getByText('PendingIn ProgressCompletedCurrent Status:PendingRemarks for status change (')).toBeVisible();
  25 | });
```