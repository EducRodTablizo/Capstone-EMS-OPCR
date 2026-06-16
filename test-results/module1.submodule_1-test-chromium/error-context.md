# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module1.submodule_1.test.ts >> test
- Location: tests\module1.submodule_1.test.ts:40:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Users' })
    - locator resolved to <a href="/users" data-discover="true" class="flex items-center transition-all gap-3 px-3 py-2 rounded-md text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white">…</a>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e6]:
      - img "PUP Caloocan logo" [ref=e8]
      - generic [ref=e9]:
        - paragraph [ref=e10]: PUP Caloocan
        - paragraph [ref=e11]: OPCR System
    - navigation [ref=e12]:
      - generic [ref=e13]: MAIN
      - link "Dashboard" [ref=e14] [cursor=pointer]:
        - /url: /dashboard
        - img [ref=e15]
        - generic [ref=e20]: Dashboard
      - generic [ref=e21]:
        - button "User Management" [ref=e22] [cursor=pointer]:
          - generic [ref=e23]:
            - img [ref=e24]
            - generic [ref=e29]: User Management
          - img [ref=e30]
        - generic [ref=e32]:
          - link "Users" [ref=e33] [cursor=pointer]:
            - /url: /users
            - generic [ref=e34]: Users
          - button "Roles" [ref=e35] [cursor=pointer]:
            - generic [ref=e36]: Roles
          - button "Permissions" [ref=e37] [cursor=pointer]:
            - generic [ref=e38]: Permissions
      - generic [ref=e39]:
        - button "OPCR" [ref=e40] [cursor=pointer]:
          - generic [ref=e41]:
            - img [ref=e42]
            - generic [ref=e45]: OPCR
          - img [ref=e46]
        - generic [ref=e48]:
          - link "Evaluation Period" [ref=e49] [cursor=pointer]:
            - /url: /sla-review
            - generic [ref=e50]: Evaluation Period
          - link "Transactions" [ref=e51] [cursor=pointer]:
            - /url: /transactions
            - generic [ref=e52]: Transactions
      - generic [ref=e53]: INSIGHTS
      - button "Records" [ref=e55] [cursor=pointer]:
        - generic [ref=e56]:
          - img [ref=e57]
          - generic [ref=e59]: Records
        - img [ref=e60]
      - link "Audit Log" [ref=e62] [cursor=pointer]:
        - /url: /audit-log
        - img [ref=e63]
        - generic [ref=e66]: Audit Log
      - button "Reports" [ref=e68] [cursor=pointer]:
        - generic [ref=e69]:
          - img [ref=e70]
          - generic [ref=e72]: Reports
        - img [ref=e73]
      - button "Analytics" [ref=e75] [cursor=pointer]:
        - img [ref=e76]
        - generic [ref=e78]: Analytics
    - generic [ref=e79]: Evaluation and Monitoring System
  - main [ref=e81]:
    - generic [ref=e82]:
      - generic [ref=e83]:
        - generic [ref=e84]:
          - button "Toggle Sidebar" [ref=e85] [cursor=pointer]:
            - img [ref=e86]
          - navigation [ref=e87]:
            - generic [ref=e89]: Home
        - generic [ref=e90]:
          - generic [ref=e91]: Jun 9, 2026 – Jun 10, 2026
          - button "Notifications" [ref=e93] [cursor=pointer]:
            - img [ref=e94]
          - button "JM John Michael Garcia subsystem admin" [ref=e99] [cursor=pointer]:
            - generic [ref=e100]: JM
            - generic [ref=e101]:
              - paragraph [ref=e102]: John Michael Garcia
              - paragraph [ref=e103]: subsystem admin
            - img [ref=e104]
      - generic [ref=e106]:
        - generic [ref=e107]:
          - heading "Dashboard" [level=2] [ref=e108]
          - paragraph [ref=e109]: Overview — Administrative Office
        - generic [ref=e110]:
          - generic [ref=e113]:
            - generic [ref=e114]:
              - paragraph [ref=e115]: Total Transactions
              - paragraph [ref=e116]: "4"
            - img [ref=e118]
          - generic [ref=e123]:
            - generic [ref=e124]:
              - paragraph [ref=e125]: In Progress
              - paragraph [ref=e126]: "1"
              - paragraph [ref=e127]: 1 pending
            - img [ref=e129]
          - generic [ref=e133]:
            - generic [ref=e134]:
              - paragraph [ref=e135]: Compliance Rate
              - paragraph [ref=e136]: 50%
              - paragraph [ref=e137]: 1 compliant
            - img [ref=e139]
          - generic [ref=e144]:
            - generic [ref=e145]:
              - paragraph [ref=e146]: SLA Breaches
              - paragraph [ref=e147]: "1"
              - paragraph [ref=e148]: needs attention
            - img [ref=e150]
        - generic [ref=e152]:
          - generic [ref=e155]:
            - img [ref=e156]
            - generic [ref=e159]:
              - paragraph [ref=e160]: "1"
              - paragraph [ref=e161]: Compliant
          - generic [ref=e164]:
            - img [ref=e165]
            - generic [ref=e169]:
              - paragraph [ref=e170]: "1"
              - paragraph [ref=e171]: Non-Compliant
          - generic [ref=e174]:
            - img [ref=e175]
            - generic [ref=e178]:
              - paragraph [ref=e179]: "2"
              - paragraph [ref=e180]: Pending SLA
        - generic [ref=e181]:
          - heading "SLA Breached Transactions (1)" [level=3] [ref=e183]:
            - img [ref=e184]
            - text: SLA Breached Transactions (1)
          - link "Emergency Medical Consultation — WITH REFERRAL Juan dela Torre · Administrative Office 31m / 22m" [ref=e188] [cursor=pointer]:
            - /url: /transactions/txn-1
            - generic [ref=e189]:
              - paragraph [ref=e190]: Emergency Medical Consultation — WITH REFERRAL
              - paragraph [ref=e191]: Juan dela Torre · Administrative Office
            - generic [ref=e192]:
              - generic [ref=e193]: 31m / 22m
              - img [ref=e194]
        - generic [ref=e196]:
          - generic [ref=e197]:
            - heading "Recent Transactions" [level=3] [ref=e198]
            - link "View all" [ref=e199] [cursor=pointer]:
              - /url: /transactions
              - text: View all
              - img [ref=e200]
          - generic [ref=e203]:
            - link "Facility Reservation Request BSIT Student Council · Jun 15, 2026 5:08 PM Pending Incomplete Pending" [ref=e204] [cursor=pointer]:
              - /url: /transactions/txn-4
              - generic [ref=e205]:
                - paragraph [ref=e206]: Facility Reservation Request
                - paragraph [ref=e207]: BSIT Student Council · Jun 15, 2026 5:08 PM
              - generic [ref=e208]:
                - generic [ref=e209]:
                  - img [ref=e210]
                  - text: Pending
                - generic [ref=e213]: Incomplete
                - generic [ref=e214]: Pending
            - link "Non-Emergency Medical Consultation (New Patient) Pedro Santos · Jun 15, 2026 4:38 PM In Progress Complete Pending" [ref=e215] [cursor=pointer]:
              - /url: /transactions/txn-3
              - generic [ref=e216]:
                - paragraph [ref=e217]: Non-Emergency Medical Consultation (New Patient)
                - paragraph [ref=e218]: Pedro Santos · Jun 15, 2026 4:38 PM
              - generic [ref=e219]:
                - generic [ref=e220]:
                  - img [ref=e221]
                  - text: In Progress
                - generic [ref=e224]: Complete
                - generic [ref=e225]: Pending
            - link "Emergency Medical Consultation — WITH REFERRAL Juan dela Torre · Jun 15, 2026 3:38 PM Completed Complete Non-Compliant" [ref=e226] [cursor=pointer]:
              - /url: /transactions/txn-1
              - generic [ref=e227]:
                - paragraph [ref=e228]: Emergency Medical Consultation — WITH REFERRAL
                - paragraph [ref=e229]: Juan dela Torre · Jun 15, 2026 3:38 PM
              - generic [ref=e230]:
                - generic [ref=e231]:
                  - img [ref=e232]
                  - text: Completed
                - generic [ref=e235]: Complete
                - generic [ref=e236]: Non-Compliant
            - link "Medical Certificate — Sick Note / Excuse Slip Maria Gomez · Jun 15, 2026 2:38 PM Completed Complete Compliant" [ref=e238] [cursor=pointer]:
              - /url: /transactions/txn-2
              - generic [ref=e239]:
                - paragraph [ref=e240]: Medical Certificate — Sick Note / Excuse Slip
                - paragraph [ref=e241]: Maria Gomez · Jun 15, 2026 2:38 PM
              - generic [ref=e242]:
                - generic [ref=e243]:
                  - img [ref=e244]
                  - text: Completed
                - generic [ref=e247]: Complete
                - generic [ref=e248]: Compliant
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1  | /*import { test, expect } from '@playwright/test';
  2  | // Module 1 Submodule 1-3 user management
  3  | test('test', async ({ page }) => {
  4  |     // submodule 1
  5  |   await page.goto('http://localhost:5175/login');
  6  |   await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  7  |   await page.getByRole('button', { name: 'Sign in' }).click();
  8  |   await page.getByRole('link', { name: 'Users' }).click();
  9  |    // submodule 2 
  10 |   await page.getByRole('button', { name: 'Logout' }).click();
  11 |   await page.getByRole('button', { name: 'Confirm' }).click();
  12 |   await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  13 |   await page.getByRole('button', { name: 'Sign in' }).click();
  14 |   await page.getByRole('link', { name: 'Transactions' }).click();
  15 |   await page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link').click();
  16 |   await page.getByRole('button', { name: 'KY Kenneth Yulip staff' }).click();
  17 |   await page.getByRole('button', { name: 'Logout' }).click();
  18 |   await page.getByRole('button', { name: 'Confirm' }).click();
  19 |   await page.getByRole('textbox', { name: 'Email address' }).click();
  20 |   await page.getByRole('textbox', { name: 'Email address' }).fill('opcr@ems.ph');
  21 |   await page.getByRole('textbox', { name: 'Password' }).click();
  22 |   await page.getByRole('textbox', { name: 'Password' }).fill('opcr123');
  23 |   await page.getByRole('button', { name: 'Sign in' }).click();
  24 |   await page.getByRole('link', { name: 'Transactions' }).click();
  25 |    // submodule 3
  26 |   await page.getByRole('link', { name: 'View' }).first().click();
  27 |   await page.getByRole('button', { name: 'PC Pau Carillio opcr evaluator' }).click();
  28 |   await page.getByRole('button', { name: 'Logout' }).click();
  29 |   await page.getByRole('button', { name: 'Confirm' }).click();
  30 |   await page.getByRole('textbox', { name: 'Email address' }).click();
  31 |   await page.getByRole('textbox', { name: 'Email address' }).fill('ebautista@pup.edu.ph');
  32 |   await page.getByRole('textbox', { name: 'Password' }).click();
  33 |   await page.getByRole('textbox', { name: 'Password' }).fill('admin123');
  34 |   await page.getByRole('button', { name: 'Sign in' }).click();
  35 |   await page.getByRole('link', { name: 'Transactions' }).click();
  36 | });*/
  37 | 
  38 | import { test, expect } from '@playwright/test';
  39 | 
  40 | test('test', async ({ page }) => {
  41 | // submodule 1
  42 |   await page.goto('http://localhost:5175/login');
  43 |   await expect(page.locator('div').nth(1)).toBeVisible();
  44 |   await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  45 |   await page.getByRole('button', { name: 'Sign in' }).click();
  46 |   await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
> 47 |   await page.getByRole('link', { name: 'Users' }).click();
     |                                                   ^ Error: locator.click: Test timeout of 30000ms exceeded.
  48 |   await expect(page.getByText('User ManagementManage user accounts, roles, and permissions. Create UserARMS')).toBeVisible();
  49 | });
```