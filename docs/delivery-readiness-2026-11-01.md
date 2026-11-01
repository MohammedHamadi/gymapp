# Delivery readiness review — 1 November 2026

> Follow-up: the five requested sales, stock, duplicate-action, archival and plan-edit fixes are now implemented. See [Operational fixes](operational-fixes-2026-11-01.md) for current behaviour and 39 passing tests. The eight outstanding type-declaration errors have also been resolved, and builds now run type checking automatically. The findings below describe the reviewed pre-fix revision; installer and remaining release checks are still outstanding.

**Verdict at review: not ready for delivery.** Reviewed source version 0.0.4 at commit 1fc2e5a. No application source or business data was changed during this review.

The membership regression suite is green, but it does not cover the sales and operational failures below. These are observable failures, not hypothetical risks.

## Checks completed

| Check | Result |
| --- | --- |
| Existing npm test suite | 21/21 passed |
| Production frontend build (npm run build) | Passed |
| Type checking (installed tsc --noEmit) | Failed: 10 diagnostics |
| Targeted in-memory business-flow checks | All eight scenarios exposed failures |
| Current development database integrity | ok |
| Current development database foreign-key violations | 0 |
| Current development database members with multiple ACTIVE subscriptions | 0 |
| Current development database barcode/member-ID mismatches | 0 |
| Existing packaged application | Version 0.0.1, different subscription repository from current source |

The local development database has not yet applied the membership migration (schema_migrations is absent). Its next launch with the current source is expected to back it up and migrate it. No migration was run against that database during this review.

## Delivery blockers

### P1 — Multi-quantity sales understate the amount recorded

Location: src/app/components/SalesPage.tsx:231, receipt line at 286, recent sales amount at 561.

The checkout handler sends total_price: item.price regardless of quantity. The receipt item line also displays the unit price. The repository inserts that amount unchanged.

Reproduction using the actual compiled SalesPage checkout handler and real in-memory repositories: three items at 100 DZD each produce a 300 DZD grand total, but the stored sale has quantity 3 and total_price 100. The receipt customer is also "undefined undefined": the handler reads first_name/last_name while members.getAll returns firstName/lastName.

Correction: use the line total consistently in stored sales, receipt and history, and derive/check the amount in the backend. Correct the member shape at the same time. Validate cart quantities and amounts before writing.

### P1 — Checkout allows overselling and never deducts stock

Location: electron/repositories/salesHistoryRepository.js:24 and insert at 28.

Neither single-sale nor batch-sale insertion reads or updates products.stock. A sale with stock zero succeeds. Selling three units from stock five leaves stock at five.

Correction: validate product availability and quantity, deduct stock, and insert the sale in one transaction. A failure on any cart item must roll back the entire cart. If some product types deliberately have unlimited stock, represent that policy explicitly.

### P1 — A repeated checkout click records the cart twice

Location: src/app/components/SalesPage.tsx:214 and checkout button at 717.

The checkout function has no in-flight guard, and its button is disabled only for an empty cart. Calling the same rendered button handler twice before its first request completes creates two sale rows for a one-item cart.

Correction: guard synchronously with a ref, disable checkout during submission, and use a backend operation ID if retries must be safe.

### P1 — Deleting a member deletes their payment history

Location: electron/repositories/memberRepository.js:146–162.

Member deletion removes subscriptions, access logs and transactions. In the fixture, monthly subscription revenue changed from 1500 DZD to zero after deletion, with no refund transaction.

Correction: archive members or retain their financial history under a non-destructive relationship. The current confirmation asks only whether to delete the person; it does not explain that recorded revenue will disappear.

### P1 — The available installer does not contain this revision

The release directory contains GymApp Setup 0.0.1.exe and an unpacked application whose embedded package.json also identifies version 0.0.1. Current package.json is version 0.0.4.

Inspection of release/win-unpacked/resources/app.asar confirmed:
- The packaged subscriptionRepository.js hash differs from the current source.
- The archive has no shared/subscriptionRules.js, used by the current implementation.

Do not deliver the existing installer as the current revision. After fixing the source blockers, build a new installer and test that specific artifact on a fresh profile and an upgraded database.

## Further confirmed operational problems

### P2 — Duplicate scans deduct multiple sessions

Location: electron/services/accessControlService.js:53 and src/app/components/ScannerPage.tsx:82–139.

Two immediate successful scans take a ten-visit subscription from ten to nine to eight. The renderer's isProcessing flag covers only the pending request; it is reset as soon as the response arrives, even while the scan result is displayed. The backend has no scan-bounce protection.

Correction: define a short duplicate-scan interval or an idempotent request mechanism that prevents accidental repeats without blocking intentional later visits.

### P2 — Editing a plan can make existing members uneditable

Location: electron/repositories/subscriptionRepository.js:10–35, invoked by electron/services/memberService.js:35.

Validation reads the plan's current duration/session rules, rather than the existing subscription's purchased terms. After creating a time-only subscription and then adding a session limit to its plan template, even editing the member's first name fails with "This plan requires a session count." The whole member save rolls back.

Correction: separate validation for new purchases/renewals from edits to an existing subscription. Preserve the purchased subscription's terms when the plan template changes.

### P2 — A denied scan incorrectly removes someone from occupancy

Location: electron/repositories/accessLogRepository.js:46–50.

getCurrentlyInside selects the latest log of any status, then requires that log to be a granted check-in. A member who checks in, is subsequently cancelled, and has a denied scan disappears from the occupancy list without any checkout. The fixture changed from one occupant to zero.

Correction: derive occupancy from the most recent granted check-in or checkout, ignoring denied attempts.

### P2 — Product edits erase the active flag

Location: electron/repositories/productRepository.js:27–31, called by SalesPage.tsx:114.

Ordinary product edits omit is_active; the update binds that missing value as NULL. The fixture reproduced active state 1 becoming NULL. The current renderer still shows such products because it filters only is_active !== 0, masking the bad state.

Correction: retain the existing flag when omitted and validate explicit flag values.

### P2 — Type checking fails despite the production build passing

The installed tsc reports ten errors:
- Seven missing declarations for imported MP3/JPG assets.
- Two member-name errors from the snake_case/camelCase model mismatch in SalesPage.tsx:618.
- Missing react-dom/client declarations.

Vite successfully transpiles the frontend but does not run a full type check. Add the required declarations/types, make API shapes consistent, and add a repeatable project type-check command with a pinned compiler.

## Other review notes

- Access-log and transaction daily queries use UTC calendar dates while other subscription logic uses local dates. Around midnight in Algeria, "today" can represent different business days. Use a consistent local-date policy and UTC-to-local conversion.
- Subscription Export and Send Reminder buttons still have no handlers.
- Plan and equipment forms close before their asynchronous save completes; validation of negative/invalid values is incomplete.
- Activation is a renderer licensing gate; staff accounts and permissions are not implemented. This is a product limitation if different employees must have different access.
- Only a one-time migration backup is implemented. There is no routine backup/restore workflow in the UI.
- The README's database location and architecture list are out of date.

## What is working in the covered tests

The 21 existing tests verify renewal immediately replaces the old subscription, switching plans cancels the old active row, a unique index blocks multiple active subscriptions, member IDs/barcodes remain stable, time-only plans permit unlimited visits, invalid/expired/future subscriptions are rejected, atomic saves roll back on failure, keyboard barcode variants resolve correctly, filters restore their saved selection, backups precede migration, and immediate scanning after renewal succeeds.

These results cover isolated logic and storage behavior. They do not establish that every packaged UI or hardware workflow works.

## Scope and evidence

Application source was inspected without changing it. Business reproductions used independent in-memory SQLite databases and the actual repositories. Sales reproductions invoked the actual transpiled component handler with controlled hooks; this is not a browser interaction test. The development database was opened read-only.

Local reproduction files:
- test-results/delivery-audit.cjs
- test-results/delivery-readiness.json
- test-results/typecheck.txt

The archive was inspected without installing or launching it. No fresh installer was built while source blockers remain. A real client database upgrade, fresh-machine installation, physical scanner, printer output, long-running desktop session and dependency vulnerability audit remain unverified.

A delivery sign-off should follow the blocker fixes, tests covering these failures, a clean type check, a fresh installer build, and a real scanner/printer acceptance check.
