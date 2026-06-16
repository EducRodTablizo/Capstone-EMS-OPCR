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
  - waiting for getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link')

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
        - button "OPCR" [ref=e22] [cursor=pointer]:
          - generic [ref=e23]:
            - img [ref=e24]
            - generic [ref=e27]: OPCR
          - img [ref=e28]
        - generic [ref=e30]:
          - link "Evaluation Period" [ref=e31] [cursor=pointer]:
            - /url: /sla-review
            - generic [ref=e32]: Evaluation Period
          - link "Transactions" [active] [ref=e33] [cursor=pointer]:
            - /url: /transactions
            - generic [ref=e34]: Transactions
      - generic [ref=e35]: INSIGHTS
      - button "Reports" [ref=e37] [cursor=pointer]:
        - generic [ref=e38]:
          - img [ref=e39]
          - generic [ref=e41]: Reports
        - img [ref=e42]
      - button "Analytics" [ref=e44] [cursor=pointer]:
        - img [ref=e45]
        - generic [ref=e47]: Analytics
    - generic [ref=e48]: Evaluation and Monitoring System
  - main [ref=e50]:
    - generic [ref=e51]:
      - generic [ref=e52]:
        - generic [ref=e53]:
          - button "Toggle Sidebar" [ref=e54] [cursor=pointer]:
            - img [ref=e55]
          - navigation [ref=e56]:
            - link "Home" [ref=e58] [cursor=pointer]:
              - /url: /dashboard
            - generic [ref=e59]:
              - generic [ref=e60]: ">"
              - link "OPCR" [ref=e61] [cursor=pointer]:
                - /url: /transactions
            - generic [ref=e62]:
              - generic [ref=e63]: ">"
              - generic [ref=e64]: Transactions
        - generic [ref=e65]:
          - generic [ref=e66]: Jun 9, 2026 – Jun 10, 2026
          - button "Notifications" [ref=e68] [cursor=pointer]:
            - img [ref=e69]
          - button "KY Kenneth Yulip staff" [ref=e74] [cursor=pointer]:
            - generic [ref=e75]: KY
            - generic [ref=e76]:
              - paragraph [ref=e77]: Kenneth Yulip
              - paragraph [ref=e78]: staff
            - img [ref=e79]
      - generic [ref=e81]:
        - generic [ref=e82]:
          - generic [ref=e83]:
            - heading "Service Transactions" [level=2] [ref=e84]
            - generic [ref=e85]:
              - img [ref=e86]
              - text: Administrative Office
          - paragraph [ref=e90]: Office-scoped view — only transactions from Administrative Office are visible.
        - generic [ref=e91]:
          - generic [ref=e92]:
            - img [ref=e93] [cursor=pointer]
            - textbox "Search transactions..." [ref=e96]
          - combobox [ref=e97] [cursor=pointer]:
            - generic [ref=e98]:
              - img [ref=e99]
              - generic: All Status
            - img [ref=e101]
          - button "New Transaction" [ref=e103] [cursor=pointer]:
            - img
            - text: New Transaction
        - paragraph [ref=e104]: Showing 4 of 4 transactions
        - table [ref=e108]:
          - rowgroup [ref=e109]:
            - row "Service Client Time In Assigned To Status Documents SLA Duration" [ref=e110]:
              - columnheader "Service" [ref=e111]
              - columnheader "Client" [ref=e112]
              - columnheader "Time In" [ref=e113]
              - columnheader "Assigned To" [ref=e114]
              - columnheader "Status" [ref=e115]
              - columnheader "Documents" [ref=e116]
              - columnheader "SLA" [ref=e117]
              - columnheader "Duration" [ref=e118]
              - columnheader [ref=e119]
          - rowgroup [ref=e120]:
            - row "Facility Reservation Request Administrative BSIT Student Council Jun 15, 2026 5:08 PM Unassigned Pending Incomplete Pending — / 12m View" [ref=e121]:
              - cell "Facility Reservation Request Administrative" [ref=e122]:
                - paragraph [ref=e123]: Facility Reservation Request
                - paragraph [ref=e124]: Administrative
              - cell "BSIT Student Council" [ref=e125]
              - cell "Jun 15, 2026 5:08 PM" [ref=e126]
              - cell "Unassigned" [ref=e127]
              - cell "Pending" [ref=e128]:
                - generic [ref=e129]:
                  - img [ref=e130]
                  - text: Pending
              - cell "Incomplete" [ref=e133]:
                - generic [ref=e134]: Incomplete
              - cell "Pending" [ref=e135]:
                - generic [ref=e136]: Pending
              - cell "— / 12m" [ref=e137]
              - cell "View" [ref=e138]:
                - link "View" [ref=e139] [cursor=pointer]:
                  - /url: /transactions/txn-4
                  - text: View
                  - img [ref=e140]
            - row "Non-Emergency Medical Consultation (New Patient) Medical Pedro Santos Jun 15, 2026 4:38 PM Jose Reyes In Progress Complete Pending — / 30m View" [ref=e142]:
              - cell "Non-Emergency Medical Consultation (New Patient) Medical" [ref=e143]:
                - paragraph [ref=e144]: Non-Emergency Medical Consultation (New Patient)
                - paragraph [ref=e145]: Medical
              - cell "Pedro Santos" [ref=e146]
              - cell "Jun 15, 2026 4:38 PM" [ref=e147]
              - cell "Jose Reyes" [ref=e148]
              - cell "In Progress" [ref=e149]:
                - generic [ref=e150]:
                  - img [ref=e151]
                  - text: In Progress
              - cell "Complete" [ref=e154]:
                - generic [ref=e155]: Complete
              - cell "Pending" [ref=e156]:
                - generic [ref=e157]: Pending
              - cell "— / 30m" [ref=e158]
              - cell "View" [ref=e159]:
                - link "View" [ref=e160] [cursor=pointer]:
                  - /url: /transactions/txn-3
                  - text: View
                  - img [ref=e161]
            - row "Emergency Medical Consultation — WITH REFERRAL Medical Juan dela Torre Jun 15, 2026 3:38 PM Jose Reyes Completed Complete Non-Compliant 31m / 22m View" [ref=e163]:
              - cell "Emergency Medical Consultation — WITH REFERRAL Medical" [ref=e164]:
                - paragraph [ref=e165]: Emergency Medical Consultation — WITH REFERRAL
                - paragraph [ref=e166]: Medical
              - cell "Juan dela Torre" [ref=e167]
              - cell "Jun 15, 2026 3:38 PM" [ref=e168]
              - cell "Jose Reyes" [ref=e169]
              - cell "Completed" [ref=e170]:
                - generic [ref=e171]:
                  - img [ref=e172]
                  - text: Completed
              - cell "Complete" [ref=e175]:
                - generic [ref=e176]: Complete
              - cell "Non-Compliant" [ref=e177]:
                - generic [ref=e178]: Non-Compliant
              - cell "31m / 22m" [ref=e180]
              - cell "View" [ref=e181]:
                - link "View" [ref=e182] [cursor=pointer]:
                  - /url: /transactions/txn-1
                  - text: View
                  - img [ref=e183]
            - row "Medical Certificate — Sick Note / Excuse Slip Medical Maria Gomez Jun 15, 2026 2:38 PM Ana Cruz Completed Complete Compliant 6m / 8m View" [ref=e185]:
              - cell "Medical Certificate — Sick Note / Excuse Slip Medical" [ref=e186]:
                - paragraph [ref=e187]: Medical Certificate — Sick Note / Excuse Slip
                - paragraph [ref=e188]: Medical
              - cell "Maria Gomez" [ref=e189]
              - cell "Jun 15, 2026 2:38 PM" [ref=e190]
              - cell "Ana Cruz" [ref=e191]
              - cell "Completed" [ref=e192]:
                - generic [ref=e193]:
                  - img [ref=e194]
                  - text: Completed
              - cell "Complete" [ref=e197]:
                - generic [ref=e198]: Complete
              - cell "Compliant" [ref=e199]:
                - generic [ref=e200]: Compliant
              - cell "6m / 8m" [ref=e201]
              - cell "View" [ref=e202]:
                - link "View" [ref=e203] [cursor=pointer]:
                  - /url: /transactions/txn-2
                  - text: View
                  - img [ref=e204]
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
  7  |   await page.getByRole('link', { name: 'Transactions' }).click();
> 8  |   await page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link').click();
     |                                                                                           ^ Error: locator.click: Test timeout of 30000ms exceeded.
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