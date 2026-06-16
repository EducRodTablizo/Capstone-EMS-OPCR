# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: module4.submodule_1.test.ts >> test
- Location: tests\module4.submodule_1.test.ts:3:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Back to Transaction' })

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
            - link "Home" [ref=e89] [cursor=pointer]:
              - /url: /dashboard
            - generic [ref=e90]:
              - generic [ref=e91]: ">"
              - link "OPCR" [ref=e92] [cursor=pointer]:
                - /url: /transactions
            - generic [ref=e93]:
              - generic [ref=e94]: ">"
              - generic [ref=e95]: Transactions
        - generic [ref=e96]:
          - generic [ref=e97]: Jun 9, 2026 – Jun 10, 2026
          - button "Notifications" [ref=e99] [cursor=pointer]:
            - img [ref=e100]
          - button "JM John Michael Garcia subsystem admin" [ref=e105] [cursor=pointer]:
            - generic [ref=e106]: JM
            - generic [ref=e107]:
              - paragraph [ref=e108]: John Michael Garcia
              - paragraph [ref=e109]: subsystem admin
            - img [ref=e110]
      - generic [ref=e112]:
        - generic [ref=e113]:
          - generic [ref=e114]:
            - heading "Service Transactions" [level=2] [ref=e115]
            - generic [ref=e116]:
              - img [ref=e117]
              - text: Administrative Office
          - paragraph [ref=e121]: Office-scoped view — only transactions from Administrative Office are visible.
        - generic [ref=e122]:
          - generic [ref=e123]:
            - img [ref=e124] [cursor=pointer]
            - textbox "Search transactions..." [ref=e127]
          - combobox [ref=e128] [cursor=pointer]:
            - generic [ref=e129]:
              - img [ref=e130]
              - generic: All Status
            - img [ref=e132]
          - button "New Transaction" [ref=e134] [cursor=pointer]:
            - img
            - text: New Transaction
        - paragraph [ref=e135]: Showing 4 of 4 transactions
        - table [ref=e139]:
          - rowgroup [ref=e140]:
            - row "Service Client Time In Assigned To Status Documents SLA Duration" [ref=e141]:
              - columnheader "Service" [ref=e142]
              - columnheader "Client" [ref=e143]
              - columnheader "Time In" [ref=e144]
              - columnheader "Assigned To" [ref=e145]
              - columnheader "Status" [ref=e146]
              - columnheader "Documents" [ref=e147]
              - columnheader "SLA" [ref=e148]
              - columnheader "Duration" [ref=e149]
              - columnheader [ref=e150]
          - rowgroup [ref=e151]:
            - row "Facility Reservation Request Administrative BSIT Student Council Jun 15, 2026 5:10 PM Unassigned Pending Incomplete Pending — / 12m View" [ref=e152]:
              - cell "Facility Reservation Request Administrative" [ref=e153]:
                - paragraph [ref=e154]: Facility Reservation Request
                - paragraph [ref=e155]: Administrative
              - cell "BSIT Student Council" [ref=e156]
              - cell "Jun 15, 2026 5:10 PM" [ref=e157]
              - cell "Unassigned" [ref=e158]
              - cell "Pending" [ref=e159]:
                - generic [ref=e160]:
                  - img [ref=e161]
                  - text: Pending
              - cell "Incomplete" [ref=e164]:
                - generic [ref=e165]: Incomplete
              - cell "Pending" [ref=e166]:
                - generic [ref=e167]: Pending
              - cell "— / 12m" [ref=e168]
              - cell "View" [ref=e169]:
                - link "View" [ref=e170] [cursor=pointer]:
                  - /url: /transactions/txn-4
                  - text: View
                  - img [ref=e171]
            - row "Non-Emergency Medical Consultation (New Patient) Medical Pedro Santos Jun 15, 2026 4:40 PM Jose Reyes In Progress Complete Pending — / 30m View" [ref=e173]:
              - cell "Non-Emergency Medical Consultation (New Patient) Medical" [ref=e174]:
                - paragraph [ref=e175]: Non-Emergency Medical Consultation (New Patient)
                - paragraph [ref=e176]: Medical
              - cell "Pedro Santos" [ref=e177]
              - cell "Jun 15, 2026 4:40 PM" [ref=e178]
              - cell "Jose Reyes" [ref=e179]
              - cell "In Progress" [ref=e180]:
                - generic [ref=e181]:
                  - img [ref=e182]
                  - text: In Progress
              - cell "Complete" [ref=e185]:
                - generic [ref=e186]: Complete
              - cell "Pending" [ref=e187]:
                - generic [ref=e188]: Pending
              - cell "— / 30m" [ref=e189]
              - cell "View" [ref=e190]:
                - link "View" [ref=e191] [cursor=pointer]:
                  - /url: /transactions/txn-3
                  - text: View
                  - img [ref=e192]
            - row "Emergency Medical Consultation — WITH REFERRAL Medical Juan dela Torre Jun 15, 2026 3:40 PM Jose Reyes Completed Complete Non-Compliant 31m / 22m View" [ref=e194]:
              - cell "Emergency Medical Consultation — WITH REFERRAL Medical" [ref=e195]:
                - paragraph [ref=e196]: Emergency Medical Consultation — WITH REFERRAL
                - paragraph [ref=e197]: Medical
              - cell "Juan dela Torre" [ref=e198]
              - cell "Jun 15, 2026 3:40 PM" [ref=e199]
              - cell "Jose Reyes" [ref=e200]
              - cell "Completed" [ref=e201]:
                - generic [ref=e202]:
                  - img [ref=e203]
                  - text: Completed
              - cell "Complete" [ref=e206]:
                - generic [ref=e207]: Complete
              - cell "Non-Compliant" [ref=e208]:
                - generic [ref=e209]: Non-Compliant
              - cell "31m / 22m" [ref=e211]
              - cell "View" [ref=e212]:
                - link "View" [ref=e213] [cursor=pointer]:
                  - /url: /transactions/txn-1
                  - text: View
                  - img [ref=e214]
            - row "Medical Certificate — Sick Note / Excuse Slip Medical Maria Gomez Jun 15, 2026 2:40 PM Ana Cruz Completed Complete Compliant 6m / 8m View" [ref=e216]:
              - cell "Medical Certificate — Sick Note / Excuse Slip Medical" [ref=e217]:
                - paragraph [ref=e218]: Medical Certificate — Sick Note / Excuse Slip
                - paragraph [ref=e219]: Medical
              - cell "Maria Gomez" [ref=e220]
              - cell "Jun 15, 2026 2:40 PM" [ref=e221]
              - cell "Ana Cruz" [ref=e222]
              - cell "Completed" [ref=e223]:
                - generic [ref=e224]:
                  - img [ref=e225]
                  - text: Completed
              - cell "Complete" [ref=e228]:
                - generic [ref=e229]: Complete
              - cell "Compliant" [ref=e230]:
                - generic [ref=e231]: Compliant
              - cell "6m / 8m" [ref=e232]
              - cell "View" [ref=e233]:
                - link "View" [ref=e234] [cursor=pointer]:
                  - /url: /transactions/txn-2
                  - text: View
                  - img [ref=e235]
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
  7  |   await page.getByRole('link', { name: 'Transactions' }).click();
  8  |   await page.getByRole('link', { name: 'View' }).first().click();
> 9  |   await page.getByRole('link', { name: 'Back to Transaction' }).click();
     |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  10 |   await page.getByRole('link', { name: 'View' }).first().click();
  11 | });
```