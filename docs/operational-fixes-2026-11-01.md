# Operational fixes — 1 November 2026

The five requested fixes from the delivery review are implemented.

## Behaviour

- A three-unit cart at 100 DZD per unit records and prints 300 DZD. The backend derives prices from the product record and checks the quote. It calculates money in integer cents and rejects stale prices or incorrect line totals.
- All stock-limited product rows are checked and deducted in the same transaction as their sale rows. A missing/inactive product, insufficient stock, invalid quantity or failed insert rolls back the entire cart. The screen shows current stock.
- Checkout has a synchronous in-flight guard, disables submission, and sends a unique request ID. Committed request IDs and their receipts are saved in SQLite. Retrying the same request after a lost response returns the original result without another sale or stock deduction. Reusing the ID for another cart is rejected.
- Repeated check-ins for the same member within three seconds of the last granted check-in are ignored without another session deduction or log entry. This uses persisted access history, so it works across screens and process restarts. A checkout or renewal into a new subscription begins a new visit. Cancellation/archival overrides the duplicate replay. The final session is protected against a rescan without making the subscription usable for later visits.
- The member action is now **Archive**. It hides the member from the current member list, cancels active access, and blocks new subscriptions/check-ins. It retains the member ID/barcode, subscriptions, sales links, payments and access history. Historical revenue does not change. Barcode IDs remain reserved and cannot be reassigned to new members. Archived members can still check out.
- Existing subscriptions are validated using their stored expiry/session-limit shape when edited. Changing or deactivating a plan template no longer prevents ordinary edits to existing members or retroactively changes purchased limits. New purchases and renewals still use the current active plan rules.

Related corrections made in the affected flows: receipt customer names use the actual API shape; product edits retain the active flag; denied scans no longer erase a prior granted check-in from occupancy.

## Database upgrade

A new migration adds members.is_archived, members.archived_at, the sales_checkouts table, and a movement-history index. It also normalizes legacy NULL product active flags. The upgrade is recorded once in schema_migrations.

The app creates a SQLite backup before migration. If the membership upgrade already created a backup during the same startup, that snapshot covers both migrations. Otherwise the new backup is named gym.db.before-sales-fix-<timestamp>.db beside the active database. A failed backup prevents the operational migration.

No working business database was migrated during development. The complete startup schema/upgrade sequence was run on a read-only snapshot copied to test-results. Row counts, payment totals, sale totals and member barcodes were identical before and after the copy's upgrade; integrity_check returned ok and foreign_key_check returned zero violations.

## Verification

- npm test: **39 passed**, including 18 new operational regression cases.
- npm run build: passed.
- git diff --check: passed.
- npm run typecheck: passed with no diagnostics. Vite asset declarations cover the MP3/JPG imports; React/React DOM 18 declarations and TypeScript 5.9.3 are pinned in devDependencies. The production build now runs type checking automatically.

Coverage includes multi-quantity totals/receipt names, out-of-stock rejection, rollback of a partial cart or failed insert, duplicate checkout clicks, lost-response retries, durable replay with depleted stock, invalid quotes/quantities, archival preserving revenue and barcodes, duplicate scans/final visits/renewal/checkout handling, old subscription edits after plan changes, and safe legacy database upgrades.

Tests use independent in-memory databases and temporary backup fixtures. Checkout handler tests run the actual transpiled component with controlled hooks, rather than automating a real browser.

## Delivery scope

These fixes prevent future occurrences. Historical sale amounts and stock figures were not recalculated, and records already deleted by an older version were not reconstructed. Review those separately if the client has affected history.

No restore/unarchive interface was added. The retained records support a future restoration feature.

No new Windows installer was generated in this change. The old installer, physical scanner/printer checks and the other outstanding items in the original delivery review still need attention before a full release sign-off.
