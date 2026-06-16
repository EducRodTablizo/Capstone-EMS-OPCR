# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module1.submodule_3.test.ts >> test
- Location: tests\module1.submodule_3.test.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Transactions' })
    - locator resolved to <a href="/transactions" data-discover="true" class="flex items-center transition-all gap-3 px-3 py-2 rounded-md text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white">…</a>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - performing click action

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
      - link "Dashboard" [ref=e14]:
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
          - link "Users" [ref=e33]:
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
          - link "Evaluation Period" [ref=e49]:
            - /url: /sla-review
            - generic [ref=e50]: Evaluation Period
          - link "Transactions" [ref=e51]:
            - /url: /transactions
            - generic [ref=e52]: Transactions
      - generic [ref=e53]: INSIGHTS
      - button "Records" [ref=e55] [cursor=pointer]:
        - generic [ref=e56]:
          - img [ref=e57]
          - generic [ref=e59]: Records
        - img [ref=e60]
      - link "Audit Log" [ref=e62]:
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
          - button "MR Mikhail Reveche subsystem admin" [ref=e99] [cursor=pointer]:
            - generic [ref=e100]: MR
            - generic [ref=e101]:
              - paragraph [ref=e102]: Mikhail Reveche
              - paragraph [ref=e103]: subsystem admin
            - img [ref=e104]
      - generic [ref=e106]:
        - generic [ref=e107]:
          - heading "Dashboard" [level=2] [ref=e108]
          - paragraph [ref=e109]: Overview — OSAS
        - generic [ref=e110]:
          - generic [ref=e113]:
            - generic [ref=e114]:
              - paragraph [ref=e115]: Total Transactions
              - paragraph [ref=e116]: "2"
            - img [ref=e118]
          - generic [ref=e123]:
            - generic [ref=e124]:
              - paragraph [ref=e125]: In Progress
              - paragraph [ref=e126]: "0"
              - paragraph [ref=e127]: 1 pending
            - img [ref=e129]
          - generic [ref=e133]:
            - generic [ref=e134]:
              - paragraph [ref=e135]: Compliance Rate
              - paragraph [ref=e136]: 0%
              - paragraph [ref=e137]: 0 compliant
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
              - paragraph [ref=e160]: "0"
              - paragraph [ref=e161]: Compliant
          - generic [ref=e164]:
            - img [ref=e165]
            - generic [ref=e169]:
              - paragraph [ref=e170]: "1"
              - paragraph [ref=e171]: Non-Compliant
          - generic [ref=e174]:
            - img [ref=e175]
            - generic [ref=e178]:
              - paragraph [ref=e179]: "1"
              - paragraph [ref=e180]: Pending SLA
        - generic [ref=e181]:
          - heading "SLA Breached Transactions (1)" [level=3] [ref=e183]:
            - img [ref=e184]
            - text: SLA Breached Transactions (1)
          - link "Request for Certificate of Good Moral Character Rosa Aquino · OSAS 11m / 12m" [ref=e188]:
            - /url: /transactions/txn-7
            - generic [ref=e189]:
              - paragraph [ref=e190]: Request for Certificate of Good Moral Character
              - paragraph [ref=e191]: Rosa Aquino · OSAS
            - generic [ref=e192]:
              - generic [ref=e193]: 11m / 12m
              - img [ref=e194]
        - generic [ref=e196]:
          - generic [ref=e197]:
            - heading "Recent Transactions" [level=3] [ref=e198]
            - link "View all" [ref=e199]:
              - /url: /transactions
              - text: View all
              - img [ref=e200]
          - generic [ref=e203]:
            - link "Counseling Service Andres Navarro · Jun 15, 2026 5:28 PM Pending Complete Pending" [ref=e204]:
              - /url: /transactions/txn-8
              - generic [ref=e205]:
                - paragraph [ref=e206]: Counseling Service
                - paragraph [ref=e207]: Andres Navarro · Jun 15, 2026 5:28 PM
              - generic [ref=e208]:
                - generic [ref=e209]:
                  - img [ref=e210]
                  - text: Pending
                - generic [ref=e213]: Complete
                - generic [ref=e214]: Pending
            - link "Request for Certificate of Good Moral Character Rosa Aquino · Jun 15, 2026 4:46 PM Completed Complete Non-Compliant" [ref=e215]:
              - /url: /transactions/txn-7
              - generic [ref=e216]:
                - paragraph [ref=e217]: Request for Certificate of Good Moral Character
                - paragraph [ref=e218]: Rosa Aquino · Jun 15, 2026 4:46 PM
              - generic [ref=e219]:
                - generic [ref=e220]:
                  - img [ref=e221]
                  - text: Completed
                - generic [ref=e224]: Complete
                - generic [ref=e225]: Non-Compliant
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('test', async ({ page }) => {
  4  |   await page.goto('http://localhost:5175/login');
  5  |   await page.getByRole('button', { name: 'Staff · Administrative Office' }).click();
  6  |   await page.getByRole('button', { name: 'Sign in' }).click();
  7  |   await page.getByRole('button', { name: 'KY Kenneth Yulip staff' }).click();
  8  |   await page.getByRole('button', { name: 'Logout' }).click();
  9  |   await page.getByRole('button', { name: 'Confirm' }).click();
  10 |   await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  11 |   await page.getByRole('button', { name: 'Sign in' }).click();
  12 |   await expect(page.getByText('DashboardOverview — OSASTotal')).toBeVisible();
> 13 |   await page.getByRole('link', { name: 'Transactions' }).click();
     |                                                          ^ Error: locator.click: Test timeout of 30000ms exceeded.
  14 |   await expect(page.locator('div').filter({ hasText: 'Service' }).nth(4)).toBeVisible();
  15 | });
```