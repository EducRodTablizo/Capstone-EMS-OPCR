# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module2.submodule_2.test.ts >> test
- Location: tests\module2.submodule_2.test.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('option', { name: 'Ryan Bill Donayre' })

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
            - link "Home" [ref=e89]:
              - /url: /dashboard
            - generic [ref=e90]:
              - generic [ref=e91]: ">"
              - link "OPCR" [ref=e92]:
                - /url: /transactions
            - generic [ref=e93]:
              - generic [ref=e94]: ">"
              - link "Transactions" [ref=e95]:
                - /url: /transactions
            - generic [ref=e96]:
              - generic [ref=e97]: ">"
              - generic [ref=e98]: Detail
        - generic [ref=e99]:
          - generic [ref=e100]: Jun 9, 2026 – Jun 10, 2026
          - button "Notifications" [ref=e102] [cursor=pointer]:
            - img [ref=e103]
          - button "JM John Michael Garcia subsystem admin" [ref=e108] [cursor=pointer]:
            - generic [ref=e109]: JM
            - generic [ref=e110]:
              - paragraph [ref=e111]: John Michael Garcia
              - paragraph [ref=e112]: subsystem admin
            - img [ref=e113]
      - generic [ref=e115]:
        - link "Back to Transaction" [ref=e116]:
          - /url: /transactions
          - img [ref=e117]
          - text: Back to Transaction
        - generic [ref=e119]:
          - generic [ref=e120]:
            - generic [ref=e121]:
              - heading "Service Information" [level=3] [ref=e123]
              - generic [ref=e124]:
                - generic [ref=e125]:
                  - paragraph [ref=e126]: Facility Reservation Request
                  - paragraph [ref=e127]: Administrative · Administrative Office
                - generic [ref=e128]:
                  - generic [ref=e129]:
                    - paragraph [ref=e130]: Client
                    - paragraph [ref=e131]: BSIT Student Council
                  - generic [ref=e132]:
                    - paragraph [ref=e133]: Created By
                    - paragraph [ref=e134]: Maria Santos
                  - generic [ref=e135]:
                    - paragraph [ref=e136]: Time In
                    - paragraph [ref=e137]:
                      - img [ref=e138]
                      - text: Jun 15, 2026 5:17 PM
                  - generic [ref=e141]:
                    - paragraph [ref=e142]: Time Out
                    - paragraph [ref=e143]:
                      - img [ref=e144]
                      - generic [ref=e147]: Auto on completion
                  - generic [ref=e148]:
                    - paragraph [ref=e149]: Remarks
                    - paragraph [ref=e150]: Waiting for documentary requirements
            - generic [ref=e151]:
              - heading "Transaction Status" [level=3] [ref=e153]
              - generic [ref=e154]:
                - generic [ref=e155]:
                  - generic [ref=e156]: Pending
                  - generic [ref=e159]: In Progress
                  - generic [ref=e162]: Completed
                - generic [ref=e164]:
                  - generic [ref=e165]: "Current Status:"
                  - generic [ref=e166]:
                    - img [ref=e167]
                    - text: Pending
                - generic [ref=e170]:
                  - generic [ref=e171]:
                    - generic [ref=e172]: Remarks for status change (Optional)
                    - generic [ref=e173]: 0 / 255
                  - textbox "Optional status remarks…" [ref=e174]
                  - button "Mark In Progress" [ref=e175] [cursor=pointer]:
                    - img
                    - text: Mark In Progress
            - generic [ref=e176]:
              - heading "Documentary Status" [level=3] [ref=e178]
              - generic [ref=e179]:
                - generic [ref=e180]:
                  - generic [ref=e181]: Incomplete
                  - generic [ref=e182]: "|"
                  - generic [ref=e183]: "Remarks:"
                  - generic [ref=e184]: Waiting for documentary requirements
                - paragraph [ref=e185]: SLA timer paused — transaction marked Incomplete is excluded from SLA timing until resolved.
                - generic [ref=e186]:
                  - generic [ref=e187]:
                    - generic [ref=e188]: Update Status
                    - generic [ref=e189]:
                      - button "Complete" [ref=e190] [cursor=pointer]
                      - button "Incomplete" [disabled]
                      - button "For Compliance" [ref=e191] [cursor=pointer]
                  - generic [ref=e192]:
                    - generic [ref=e193]:
                      - generic [ref=e194]: Documentary Remarks (Optional)
                      - generic [ref=e195]: 0 / 255
                    - textbox "Remarks (e.g. missing attachment)..." [ref=e196]
            - generic [ref=e197]:
              - heading "Assignment" [level=3] [ref=e199]
              - generic [ref=e200]:
                - generic [ref=e201]:
                  - img [ref=e202]
                  - generic [ref=e205]: Unassigned
                - generic [ref=e206]:
                  - text: Reassign to (same-office staff)
                  - combobox [ref=e207] [cursor=pointer]:
                    - generic: Select staff…
                    - img [ref=e208]
          - generic [ref=e210]:
            - generic [ref=e211]:
              - heading "SLA Compliance" [level=3] [ref=e213]
              - generic [ref=e214]:
                - generic [ref=e215]: Pending
                - generic [ref=e216]:
                  - generic [ref=e217]:
                    - generic [ref=e218]: SLA Target
                    - generic [ref=e219]: 12m
                  - generic [ref=e220]:
                    - generic [ref=e221]: Actual Time
                    - generic [ref=e222]: —
                  - generic [ref=e223]:
                    - generic [ref=e224]: Variance
                    - generic [ref=e225]: —
                - paragraph [ref=e226]: SLA will be computed and submitted to PSS when this transaction is completed (EMS-010).
            - heading "Audit Timeline" [level=3] [ref=e229]
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('test', async ({ page }) => {
  4  |   await page.goto('http://localhost:5175/login');
  5  |   await page.getByRole('button', { name: 'Subsystem Admin · Administrative Office admin@ems.ph / admin123 Use →' }).click();
  6  |   await page.getByRole('button', { name: 'Sign in' }).click();
  7  |   await expect(page.getByText('DashboardOverview — Administrative OfficeTotal Transactions4In Progress11')).toBeVisible();
  8  |   await page.getByRole('link', { name: 'Transactions' }).click();
  9  |   await page.getByRole('link', { name: 'View' }).first().click();
  10 |   await expect(page.getByText('Back to TransactionService')).toBeVisible();
> 11 |   await page.getByRole('option', { name: 'Ryan Bill Donayre' }).click();
     |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  12 |   await page.getByRole('button', { name: 'Confirm' }).click();
  13 |   await page.getByRole('button', { name: 'JM John Michael Garcia' }).click();
  14 |   await page.getByRole('button', { name: 'Logout' }).click();
  15 |   await page.getByRole('button', { name: 'Confirm' }).click();
  16 |   await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  17 |   await page.getByRole('button', { name: 'Sign in' }).click();
  18 |   await expect(page.getByText('DashboardOverview — OSASTotal')).toBeVisible();
  19 |   await page.getByRole('link', { name: 'Transactions' }).click();
  20 |   await page.getByRole('link', { name: 'View' }).first().click();
  21 | });
```