# Membership audit — 26 October 2026

## Requested behaviour

The status filters on Members and Subscriptions now remember their last selection on this installation, including after navigation and restarting the app. Select **Hide cancelled** to retain active and expired entries while hiding cancelled entries. The existing default is still All Status until a choice is made. No subscription history is deleted to hide cancelled renewals.

Renewal immediately replaces the old subscription, as requested. Unused days and sessions are not carried over. Switching plans uses the same replacement rule. Duration calculations retain the existing start date plus duration convention, and access remains valid through the end date.

## Confirmed problems fixed

| Problem | Correction |
| --- | --- |
| Renewal cancelled only subscriptions for the newly selected plan, permitting simultaneous active plans | Renewal cancels every active subscription for that member inside the payment transaction |
| New subscriptions, status changes and edits could create multiple active subscriptions | Repository validation plus a SQLite partial unique index enforce at most one active subscription per member |
| Member view selected by creation timestamp alone, sometimes choosing an old row or a newer cancelled historical row | Prefer the active subscription, then the highest subscription ID; expose actual plan ID, paid price and auto-renew values |
| Time-only plans were saved with zero sessions, denying access | Store unlimited visits as NULL; upgrade legacy time-only zero values; only decrement limited subscriptions |
| Expired dates and exhausted visits could still appear Active until a scan | Refresh expired status before subscription/member reads; last visit expires the subscription immediately |
| Future subscriptions could grant early access | Deny before the subscription start date and exclude future starts from current active statistics |
| Member creation and subscription/payment creation used separate IPC calls | Save them in one SQLite transaction; invalid subscriptions cannot leave partially created members |
| Member edit could silently change an old subscription's plan and misread the paid amount | Bind by plan ID, preserve the actual paid price, and use Renew for plan changes; reject member/plan reassignment in the repository |
| Editing a paid subscription could disagree with recorded payment totals | Update the existing subscription payment when correcting its paid amount |
| Renewal/edit dialogs closed before save completed and lost failed entries | Await save, retain failed forms and prevent repeated submission while saving |
| Changing renewal start date reset a manually adjusted price | Recalculate dates separately from the selected plan's price |
| Barcode normalizer confused AZERTY and QWERTY mappings, especially overlapping characters | Resolve keyboard variants centrally at check-in; ambiguous matches are rejected before deducting visits |
| New member IDs used a repeating truncated timestamp | Generate an unused ID with the same GYM plus eight digits format in the backend transaction |
| Nullable plan fields could become undefined SQLite bindings | Use explicit null defaults |
| Deleting referenced plans failed without a useful explanation | Preserve plans with subscription history and tell the operator to deactivate them |

## Barcode guarantee

Printed cards encode the member ID with CODE128. Member edits and renewals never change that ID or the stored qr_code. The new ID generator affects new members only; existing cards keep their existing IDs. Check-in accepts existing printed IDs and stored barcode aliases. Regression tests cover renewal into the same plan, switching plans, editing members, and scanner keyboard variants. Physical scanner and printer hardware have not been tested.

## Existing database upgrade

On first launch of this version, the app creates a consistent SQLite backup beside gym.db before applying the membership migration. The filename is gym.db.before-subscription-fix-<timestamp>.db. A failed backup stops the upgrade. Development uses the repository gym.db; an installed app uses Electron's userData directory.

The migration repairs legacy unlimited-visit rows, marks elapsed/exhausted active rows expired, retains the newest remaining active row per member, and marks older active duplicates cancelled. It preserves subscription rows, payments and access history. A migration marker prevents repeating it, and a unique index prevents recurrence. Existing duplicate benefits are not merged, matching the immediate replacement renewal policy.

The tracked development database had local changes before this task. The audit reads it in read-only mode; the application and migration were not launched against it.

## Other confirmed issues requiring follow-up

These are separate from the implemented membership changes.

1. **Sales inventory is never deducted or checked at checkout.** electron/repositories/salesHistoryRepository.js inserts sale rows without updating products.stock. Repeated sales can exceed available stock. Checkout needs server-side stock validation and deduction in the same transaction.
2. **Editing a product omits is_active.** src/app/components/SalesPage.tsx sends no is_active field during edits; electron/repositories/productRepository.js binds that undefined field in UPDATE. Preserve the previous active state when omitted.
3. **Deleting a member permanently removes their subscriptions, access logs and subscription transactions.** electron/repositories/memberRepository.js implements hard deletion. This destroys financial history and can make reports change. Prefer member archival if retention is required. Linked product sales are now detached from the deleted member rather than causing a foreign-key failure.
4. **Repeated successful scans still represent separate visits.** Atomic deduction prevents partial writes, but two separate scan requests can each use a session. There is no backend duplicate-scan cooldown; a suitable interval needs an operating policy.
5. **Export and Send Reminder are placeholder buttons.** SubscriptionsPage renders them without click handlers.
6. **There is no staff authentication or permission system.** Activation is checked in the React interface; IPC operations are not protected by staff roles. This remains a licensing gate rather than an admin-access control.
7. **The receipt reads member names using snake_case although members.getAll returns camelCase.** SalesPage can print an undefined customer name for a selected member.

## Validation

Run npm test for the SQLite integration and filter storage regression suite. The test runner uses Electron's Node runtime to match the installed better-sqlite3 binary; it uses independent in-memory databases and temporary backup files. No dependency rebuild is required.

Run npm run build for the production frontend. UI changes compile through Vite. Browser interaction, packaged installer execution, real printer output, and hardware scanner behaviour are outside this verification.

The final check also records a read-only summary of the current development database below.

```json
{
  "integrity": "ok",
  "foreign_key_violations": 0,
  "members": 1,
  "subscriptions": 8,
  "members_with_multiple_active": 0,
  "time_only_subscriptions_with_zero_sessions": 0,
  "stored_barcode_different_from_member_id": 0,
  "active_but_expired_or_exhausted": 0
}
```
