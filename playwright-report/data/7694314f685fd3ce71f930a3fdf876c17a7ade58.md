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
Error: locator.click: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic:
  - generic:
    - generic:
      - complementary:
        - generic:
          - generic:
            - generic:
              - img
            - generic:
              - paragraph: PUP Caloocan
              - paragraph: OPCR System
        - navigation:
          - generic: MAIN
          - link:
            - /url: /dashboard
            - img
            - generic: Dashboard
          - generic:
            - button:
              - generic:
                - img
                - generic: OPCR
              - img
            - generic:
              - link:
                - /url: /sla-review
                - generic: Evaluation Period
              - link:
                - /url: /transactions
                - generic: Transactions
          - generic: INSIGHTS
          - generic:
            - button:
              - generic:
                - img
                - generic: Reports
              - img
          - button:
            - img
            - generic: Analytics
        - generic: Evaluation and Monitoring System
      - generic:
        - main:
          - generic:
            - generic:
              - generic:
                - button:
                  - img
                - navigation:
                  - generic:
                    - link:
                      - /url: /dashboard
                      - text: Home
                  - generic:
                    - generic: ">"
                    - link:
                      - /url: /transactions
                      - text: OPCR
                  - generic:
                    - generic: ">"
                    - generic: Transactions
              - generic:
                - generic: Jun 9, 2026 – Jun 10, 2026
                - generic:
                  - button:
                    - img
                - generic:
                  - button:
                    - generic: KY
                    - generic:
                      - paragraph: Kenneth Yulip
                      - paragraph: staff
                    - img
            - generic:
              - generic:
                - generic:
                  - heading [level=2]: Service Transactions
                  - generic:
                    - img
                    - text: Administrative Office
                - paragraph: Office-scoped view — only transactions from Administrative Office are visible.
              - generic:
                - generic:
                  - img
                  - textbox:
                    - /placeholder: Search transactions...
                - combobox:
                  - generic:
                    - img
                    - generic: All Status
                  - img
                - button:
                  - img
                  - text: New Transaction
              - paragraph: Showing 4 of 4 transactions
              - generic:
                - generic:
                  - generic:
                    - table:
                      - rowgroup:
                        - row:
                          - columnheader: Service
                          - columnheader: Client
                          - columnheader: Time In
                          - columnheader: Assigned To
                          - columnheader: Status
                          - columnheader: Documents
                          - columnheader: SLA
                          - columnheader: Duration
                          - columnheader
                      - rowgroup:
                        - row:
                          - cell:
                            - paragraph: Facility Reservation Request
                            - paragraph: Administrative
                          - cell: BSIT Student Council
                          - cell: Jun 15, 2026 5:12 PM
                          - cell: Unassigned
                          - cell:
                            - generic:
                              - img
                              - text: Pending
                          - cell:
                            - generic: Incomplete
                          - cell:
                            - generic: Pending
                          - cell: — / 12m
                          - cell:
                            - link:
                              - /url: /transactions/txn-4
                              - text: View
                              - img
                        - row:
                          - cell:
                            - paragraph: Non-Emergency Medical Consultation (New Patient)
                            - paragraph: Medical
                          - cell: Pedro Santos
                          - cell: Jun 15, 2026 4:42 PM
                          - cell: Jose Reyes
                          - cell:
                            - generic:
                              - img
                              - text: In Progress
                          - cell:
                            - generic: Complete
                          - cell:
                            - generic: Pending
                          - cell: — / 30m
                          - cell:
                            - link:
                              - /url: /transactions/txn-3
                              - text: View
                              - img
                        - row:
                          - cell:
                            - paragraph: Emergency Medical Consultation — WITH REFERRAL
                            - paragraph: Medical
                          - cell: Juan dela Torre
                          - cell: Jun 15, 2026 3:42 PM
                          - cell: Jose Reyes
                          - cell:
                            - generic:
                              - img
                              - text: Completed
                          - cell:
                            - generic: Complete
                          - cell:
                            - generic: Non-Compliant
                          - cell: 31m / 22m
                          - cell:
                            - link:
                              - /url: /transactions/txn-1
                              - text: View
                              - img
                        - row:
                          - cell:
                            - paragraph: Medical Certificate — Sick Note / Excuse Slip
                            - paragraph: Medical
                          - cell: Maria Gomez
                          - cell: Jun 15, 2026 2:42 PM
                          - cell: Ana Cruz
                          - cell:
                            - generic:
                              - img
                              - text: Completed
                          - cell:
                            - generic: Complete
                          - cell:
                            - generic: Compliant
                          - cell: 6m / 8m
                          - cell:
                            - link:
                              - /url: /transactions/txn-2
                              - text: View
                              - img
      - list
  - dialog "New Service Transaction" [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e5]:
        - heading "New Service Transaction" [level=2] [ref=e6]
        - paragraph [ref=e7]: Record a new transaction and auto-generate time-in, SLA, and audit timeline.
        - generic [ref=e9]: Service
      - generic [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e13]:
            - generic [ref=e14]:
              - generic [ref=e15]:
                - paragraph [ref=e16]: Service Information
                - paragraph [ref=e17]: EMS-004 / EMS-005 metadata
              - generic [ref=e18]: Time-In auto-recorded
            - generic [ref=e19]:
              - generic [ref=e20]:
                - text: Office / Service Office
                - textbox [disabled] [ref=e21]: Administrative Office
              - generic [ref=e22]:
                - text: Service Type *
                - combobox [active] [ref=e23] [cursor=pointer]:
                  - generic: Select a service…
                  - img [ref=e24]
                - combobox [ref=e26]
            - generic [ref=e27]:
              - generic [ref=e28]:
                - text: Assign To
                - combobox [ref=e29] [cursor=pointer]:
                  - generic: Unassigned
                  - img [ref=e30]
                - combobox [ref=e32]
                - paragraph [ref=e33]: Only office staff can be assigned.
              - generic [ref=e34]:
                - text: Client Type *
                - combobox [ref=e35] [cursor=pointer]:
                  - generic: Student
                  - img [ref=e36]
                - combobox [ref=e38]
            - generic [ref=e39]:
              - generic [ref=e40]:
                - generic [ref=e41]: Remarks (Optional)
                - generic [ref=e42]: 0 / 255
              - textbox "Optional remarks…" [ref=e43]
          - generic [ref=e45]:
            - generic [ref=e46]:
              - paragraph [ref=e47]: Client Information
              - paragraph [ref=e48]: Additional client details for the transaction.
            - generic [ref=e49]:
              - generic [ref=e50]:
                - text: First Name *
                - textbox "First Name" [ref=e51]
              - generic [ref=e52]:
                - text: Middle Name (Optional)
                - textbox "Middle Name (Optional)" [ref=e53]
              - generic [ref=e54]:
                - text: Surname *
                - textbox "Surname" [ref=e55]
            - generic [ref=e56]:
              - generic [ref=e57]:
                - text: Student Number (Optional)
                - textbox "2026-01234-CM-0" [ref=e58]
              - generic [ref=e59]:
                - text: Course / Program (Optional)
                - textbox "e.g., BSIT (BS Information Technology)" [ref=e60]
            - generic [ref=e61]:
              - generic [ref=e62]:
                - text: Year Level (Optional)
                - combobox [ref=e63] [cursor=pointer]:
                  - generic: Select year level
                  - img [ref=e64]
                - combobox [ref=e66]
              - generic [ref=e67]:
                - text: Contact Number *
                - textbox "09XXXXXXXXX" [ref=e68]
            - generic [ref=e69]:
              - text: Organization / Institution (Optional)
              - textbox "e.g., CommiT Society" [ref=e70]
          - generic [ref=e72]:
            - generic [ref=e73]:
              - paragraph [ref=e74]: Service-Specific Fields (Optional)
              - paragraph [ref=e75]: Fields change depending on the selected service.
            - generic [ref=e76]: Select a service to reveal service-specific fields.
        - generic [ref=e78]:
          - button "Cancel" [ref=e79] [cursor=pointer]
          - button "Submit Transaction" [ref=e80] [cursor=pointer]
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
  8  |   await page.getByRole('row', { name: 'Facility Reservation Request' }).getByRole('link').click();
  9  |   await page.getByRole('link', { name: 'Back to Transaction' }).click();
  10 |   await page.getByRole('button', { name: 'New Transaction' }).click();
> 11 |   await page.getByRole('combobox').filter({ hasText: 'Select a service…' }).click();
     |                                                                             ^ Error: locator.click: Target page, context or browser has been closed
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