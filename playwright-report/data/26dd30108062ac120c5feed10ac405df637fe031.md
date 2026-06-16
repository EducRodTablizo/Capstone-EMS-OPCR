# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module4.submodule_2.test.ts >> test
- Location: tests\module4.submodule_2.test.ts:4:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' })
    - locator resolved to <button type="button" class="w-full flex items-center justify-between px-3 py-2 rounded-md text-left hover:bg-accent transition-colors group">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img "PUP Logo" [ref=e7]
    - heading "Evaluation &" [level=1] [ref=e8]
    - heading "Monitoring System" [level=1] [ref=e9]
    - paragraph [ref=e10]: PUP Caloocan — OPCR Compliance Platform
  - generic [ref=e11]:
    - generic [ref=e12]:
      - heading "Sign in to your account" [level=3] [ref=e13]
      - paragraph [ref=e14]: Credentials are validated via the Administrative & Records Management System (ARMS)
    - generic [ref=e16]:
      - generic [ref=e17]:
        - text: Email address
        - textbox "Email address" [ref=e18]:
          - /placeholder: you@pup.edu.ph
      - generic [ref=e19]:
        - text: Password
        - generic [ref=e20]:
          - textbox "Password" [ref=e21]:
            - /placeholder: ••••••••
          - button [ref=e22] [cursor=pointer]:
            - img [ref=e23]
      - button "Sign in" [ref=e26] [cursor=pointer]
  - generic [ref=e27]:
    - heading "Demo Accounts" [level=3] [ref=e29]
    - generic [ref=e31]:
      - button "Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →" [ref=e32] [cursor=pointer]:
        - generic [ref=e33]:
          - paragraph [ref=e34]: Subsystem Admin · Administrative Office
          - paragraph [ref=e35]: admin@ems.ph / admin123
        - generic [ref=e36]: Use →
      - button "Staff · Administrative Office staff@ems.ph / staff123 Use →" [ref=e37] [cursor=pointer]:
        - generic [ref=e38]:
          - paragraph [ref=e39]: Staff · Administrative Office
          - paragraph [ref=e40]: staff@ems.ph / staff123
        - generic [ref=e41]: Use →
      - button "OPCR Evaluator · Cross-Office opcr@ems.ph / opcr123 Use →" [ref=e42] [cursor=pointer]:
        - generic [ref=e43]:
          - paragraph [ref=e44]: OPCR Evaluator · Cross-Office
          - paragraph [ref=e45]: opcr@ems.ph / opcr123
        - generic [ref=e46]: Use →
      - button "Subsystem Admin · OSAS ebautista@pup.edu.ph / admin123 Use →" [ref=e47] [cursor=pointer]:
        - generic [ref=e48]:
          - paragraph [ref=e49]: Subsystem Admin · OSAS
          - paragraph [ref=e50]: ebautista@pup.edu.ph / admin123
        - generic [ref=e51]: Use →
      - button "Subsystem Admin · Academic Office academic_admin@ems.ph / demo123 Use →" [ref=e52] [cursor=pointer]:
        - generic [ref=e53]:
          - paragraph [ref=e54]: Subsystem Admin · Academic Office
          - paragraph [ref=e55]: academic_admin@ems.ph / demo123
        - generic [ref=e56]: Use →
      - button "Staff · Academic Office academic_staff@ems.ph / demo123 Use →" [ref=e57] [cursor=pointer]:
        - generic [ref=e58]:
          - paragraph [ref=e59]: Staff · Academic Office
          - paragraph [ref=e60]: academic_staff@ems.ph / demo123
        - generic [ref=e61]: Use →
```

# Test source

```ts
  1  | 
  2  | import { test, expect } from '@playwright/test';
  3  | 
  4  | test('test', async ({ page }) => {
  5  |   await page.goto('http://localhost:5175/login');
> 6  |   await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
     |                                                                                                                     ^ Error: locator.click: Test timeout of 30000ms exceeded.
  7  |   await page.getByRole('button', { name: 'Sign in' }).click();
  8  |   await page.getByRole('link', { name: 'Transactions' }).click();
  9  |   await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  10 |   await page.getByRole('button', { name: 'Logout' }).click();
  11 |   await page.getByRole('button', { name: 'Confirm' }).click();
  12 |   await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  13 |   await page.getByRole('button', { name: 'Sign in' }).click();
  14 |   await page.getByRole('link', { name: 'Transactions' }).click();
  15 |   await page.getByRole('button', { name: 'KY Kenneth Yulip staff' }).click();
  16 |   await page.getByRole('button', { name: 'Logout' }).click();
  17 |   await page.getByRole('button', { name: 'Confirm' }).click();
  18 |   await page.getByRole('button', { name: 'OPCR Evaluator · Cross-Office' }).click();
  19 |   await page.getByRole('button', { name: 'Sign in' }).click();
  20 |   await page.getByRole('link', { name: 'Transactions' }).click();
  21 |   await page.getByRole('button', { name: 'PC Pau Carillio opcr evaluator' }).click();
  22 |   await page.getByRole('button', { name: 'Logout' }).click();
  23 |   await page.getByRole('button', { name: 'Confirm' }).click();
  24 |   await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  25 |   await page.getByRole('button', { name: 'Sign in' }).click();
  26 |   await page.getByRole('link', { name: 'Transactions' }).click();
  27 |   await page.getByRole('button', { name: 'MR Mikhail Reveche subsystem' }).click();
  28 |   await page.getByRole('button', { name: 'Logout' }).click();
  29 |   await page.getByRole('button', { name: 'Confirm' }).click();
  30 |   await page.getByRole('button', { name: 'Subsystem Admin · Academic' }).click();
  31 |   await page.getByRole('button', { name: 'Sign in' }).click();
  32 |   await page.getByRole('link', { name: 'Transactions' }).click();
  33 |   await page.getByRole('button', { name: 'DA Dr. Ana Reyes subsystem' }).click();
  34 |   await page.getByRole('button', { name: 'Logout' }).click();
  35 |   await page.getByRole('button', { name: 'Confirm' }).click();
  36 |   await page.getByRole('button', { name: 'Staff · Academic Office' }).click();
  37 |   await page.getByRole('button', { name: 'Sign in' }).click();
  38 |   await page.getByRole('link', { name: 'Transactions' }).click();
  39 |   await page.getByRole('button', { name: 'BS Ben Santos staff' }).click();
  40 |   await page.getByRole('button', { name: 'Logout' }).click();
  41 |   await page.getByRole('button', { name: 'Confirm' }).click();
  42 | });
```