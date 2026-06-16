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
  - waiting for getByRole('button', { name: 'KY Kenneth Yulip staff' })
    - locator resolved to <button class="flex items-center gap-3 p-1.5 rounded-lg hover:bg-muted text-left transition-all">…</button>
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
        - button "OPCR" [ref=e22] [cursor=pointer]:
          - generic [ref=e23]:
            - img [ref=e24]
            - generic [ref=e27]: OPCR
          - img [ref=e28]
        - generic [ref=e30]:
          - link "Evaluation Period" [ref=e31] [cursor=pointer]:
            - /url: /sla-review
            - generic [ref=e32]: Evaluation Period
          - link "Transactions" [ref=e33] [cursor=pointer]:
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
            - generic [ref=e58]: Home
        - generic [ref=e59]:
          - generic [ref=e60]: Jun 9, 2026 – Jun 10, 2026
          - button "Notifications" [ref=e62] [cursor=pointer]:
            - img [ref=e63]
          - button "KY Kenneth Yulip staff" [ref=e68] [cursor=pointer]:
            - generic [ref=e69]: KY
            - generic [ref=e70]:
              - paragraph [ref=e71]: Kenneth Yulip
              - paragraph [ref=e72]: staff
            - img [ref=e73]
      - generic [ref=e75]:
        - generic [ref=e76]:
          - heading "Dashboard" [level=2] [ref=e77]
          - paragraph [ref=e78]: Overview — Administrative Office
        - generic [ref=e79]:
          - generic [ref=e82]:
            - generic [ref=e83]:
              - paragraph [ref=e84]: Total Transactions
              - paragraph [ref=e85]: "4"
            - img [ref=e87]
          - generic [ref=e92]:
            - generic [ref=e93]:
              - paragraph [ref=e94]: In Progress
              - paragraph [ref=e95]: "1"
              - paragraph [ref=e96]: 1 pending
            - img [ref=e98]
          - generic [ref=e102]:
            - generic [ref=e103]:
              - paragraph [ref=e104]: Compliance Rate
              - paragraph [ref=e105]: 50%
              - paragraph [ref=e106]: 1 compliant
            - img [ref=e108]
          - generic [ref=e113]:
            - generic [ref=e114]:
              - paragraph [ref=e115]: SLA Breaches
              - paragraph [ref=e116]: "1"
              - paragraph [ref=e117]: needs attention
            - img [ref=e119]
        - generic [ref=e121]:
          - generic [ref=e124]:
            - img [ref=e125]
            - generic [ref=e128]:
              - paragraph [ref=e129]: "1"
              - paragraph [ref=e130]: Compliant
          - generic [ref=e133]:
            - img [ref=e134]
            - generic [ref=e138]:
              - paragraph [ref=e139]: "1"
              - paragraph [ref=e140]: Non-Compliant
          - generic [ref=e143]:
            - img [ref=e144]
            - generic [ref=e147]:
              - paragraph [ref=e148]: "2"
              - paragraph [ref=e149]: Pending SLA
        - generic [ref=e150]:
          - heading "SLA Breached Transactions (1)" [level=3] [ref=e152]:
            - img [ref=e153]
            - text: SLA Breached Transactions (1)
          - link "Emergency Medical Consultation — WITH REFERRAL Juan dela Torre · Administrative Office 31m / 22m" [ref=e157] [cursor=pointer]:
            - /url: /transactions/txn-1
            - generic [ref=e158]:
              - paragraph [ref=e159]: Emergency Medical Consultation — WITH REFERRAL
              - paragraph [ref=e160]: Juan dela Torre · Administrative Office
            - generic [ref=e161]:
              - generic [ref=e162]: 31m / 22m
              - img [ref=e163]
        - generic [ref=e165]:
          - generic [ref=e166]:
            - heading "Recent Transactions" [level=3] [ref=e167]
            - link "View all" [ref=e168] [cursor=pointer]:
              - /url: /transactions
              - text: View all
              - img [ref=e169]
          - generic [ref=e172]:
            - link "Facility Reservation Request BSIT Student Council · Jun 15, 2026 5:08 PM Pending Incomplete Pending" [ref=e173] [cursor=pointer]:
              - /url: /transactions/txn-4
              - generic [ref=e174]:
                - paragraph [ref=e175]: Facility Reservation Request
                - paragraph [ref=e176]: BSIT Student Council · Jun 15, 2026 5:08 PM
              - generic [ref=e177]:
                - generic [ref=e178]:
                  - img [ref=e179]
                  - text: Pending
                - generic [ref=e182]: Incomplete
                - generic [ref=e183]: Pending
            - link "Non-Emergency Medical Consultation (New Patient) Pedro Santos · Jun 15, 2026 4:38 PM In Progress Complete Pending" [ref=e184] [cursor=pointer]:
              - /url: /transactions/txn-3
              - generic [ref=e185]:
                - paragraph [ref=e186]: Non-Emergency Medical Consultation (New Patient)
                - paragraph [ref=e187]: Pedro Santos · Jun 15, 2026 4:38 PM
              - generic [ref=e188]:
                - generic [ref=e189]:
                  - img [ref=e190]
                  - text: In Progress
                - generic [ref=e193]: Complete
                - generic [ref=e194]: Pending
            - link "Emergency Medical Consultation — WITH REFERRAL Juan dela Torre · Jun 15, 2026 3:38 PM Completed Complete Non-Compliant" [ref=e195] [cursor=pointer]:
              - /url: /transactions/txn-1
              - generic [ref=e196]:
                - paragraph [ref=e197]: Emergency Medical Consultation — WITH REFERRAL
                - paragraph [ref=e198]: Juan dela Torre · Jun 15, 2026 3:38 PM
              - generic [ref=e199]:
                - generic [ref=e200]:
                  - img [ref=e201]
                  - text: Completed
                - generic [ref=e204]: Complete
                - generic [ref=e205]: Non-Compliant
            - link "Medical Certificate — Sick Note / Excuse Slip Maria Gomez · Jun 15, 2026 2:38 PM Completed Complete Compliant" [ref=e207] [cursor=pointer]:
              - /url: /transactions/txn-2
              - generic [ref=e208]:
                - paragraph [ref=e209]: Medical Certificate — Sick Note / Excuse Slip
                - paragraph [ref=e210]: Maria Gomez · Jun 15, 2026 2:38 PM
              - generic [ref=e211]:
                - generic [ref=e212]:
                  - img [ref=e213]
                  - text: Completed
                - generic [ref=e216]: Complete
                - generic [ref=e217]: Compliant
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
> 7  |   await page.getByRole('button', { name: 'KY Kenneth Yulip staff' }).click();
     |                                                                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  8  |   await page.getByRole('button', { name: 'Logout' }).click();
  9  |   await page.getByRole('button', { name: 'Confirm' }).click();
  10 |   await page.getByRole('button', { name: 'Subsystem Admin · OSAS' }).click();
  11 |   await page.getByRole('button', { name: 'Sign in' }).click();
  12 |   await expect(page.getByText('DashboardOverview — OSASTotal')).toBeVisible();
  13 |   await page.getByRole('link', { name: 'Transactions' }).click();
  14 |   await expect(page.locator('div').filter({ hasText: 'Service' }).nth(4)).toBeVisible();
  15 | });
```