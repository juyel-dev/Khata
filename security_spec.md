# Security Specification & Test-Driven Security (Phase 0)

## 1. Data Invariants

1. **Strict User Isolation**: All ledger data (notebooks, transactions) belongs strictly to the authenticated user under `/users/{userId}/...`. No user can read, list, create, update, or delete any data belonging to another user.
2. **Relational Consistency**: A notebook cannot be created or accessed by anyone other than its owning user. A transaction must belong to a notebook path owned by the same user (`notebookId` is immutable on update — a transaction cannot be moved to a different notebook). `personName` is a free-text field, not a separate entity, so no cross-reference validation applies to it.
3. **Identity Verification**: The document `userId` and path `{userId}` must strictly equal `request.auth.uid`. No user can forge records claiming to be from another user.
4. **Field Boundaries & Type Safety**:
   - `name` / `personName`: String between 1 and 100 characters.
   - `openingBalance`: Integer paise.
   - `amount`: Integer paise, strictly greater than 0.
   - `type`: Must be either `'gave'` or `'got'`.
   - `note`: Optional string not exceeding 500 characters.
   - `pinned` / `archived`: Boolean.
   - `deletedAt`: Always present; either `null` or an integer epoch-ms tombstone (soft-delete). Never a string, never absent.
   - Document IDs: Max 128 chars, matching `^[a-zA-Z0-9_\-]+$`.
5. **Timestamp & Mutation Immutability**:
   - `id`, `userId`, `createdAt` are immutable after creation. `notebookId` on a transaction is immutable after creation.
   - `updatedAt` (notebooks) / `createdAt` (both) validated against server time `request.time`. Transactions in this schema version do not sync an `updatedAt` field to Firestore.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Cross-Tenant Hijack (Identity Spoofing)**: User A tries to create a notebook under `/users/{userB_id}/notebooks/{nb1}` with User B's `userId`.
2. **Shadow Field Injection**: Writing a notebook with an unauthorized privilege flag `{ ...notebookData, isAdmin: true, role: 'admin' }`.
3. **Massive Payload Denial-of-Wallet**: Writing a person name with a 500KB string to exhaust storage and bandwidth.
4. **ID Poisoning Attack**: Passing a junk path ID like `../../secrets` or 2KB non-alphanumeric string.
5. **Negative/Zero Amount Tampering**: Writing a transaction with `{ amount: -50000 }` or `{ amount: 0 }` to corrupt ledger balance arithmetic.
6. **Floating Point Fractional Exploit**: Writing a transaction with fractional amount `{ amount: 12.3456 }` instead of integer paise.
7. **Type Confusion on Transaction Type**: Setting `{ type: 'stole' }` or `{ type: 1 }` instead of allowed enum `['gave', 'got']`.
8. **Unauthenticated Read/Write Breach**: Anonymous unauthenticated caller attempting `list` or `get` on `/users/{userId}/transactions`.
9. **Orphan Transaction Injection**: Creating a transaction pointing to a nonexistent notebook ID (format-valid but no such document — same limitation as before: format is checked, cross-collection existence is not, to avoid extra read cost in rules; this only lets a user create a dangling reference inside their own path space, not access another user's data).
10. **Immutable Field Mutator**: Modifying `createdAt`, `userId`, or (for transactions) `notebookId` in an existing notebook or transaction to rewrite history or move a transaction to a different ledger.
11. **Client-Forced Timestamp Spoofing**: Supplying a backdated or future client timestamp instead of server timestamp `request.time`.
12. **PII Harvesting / Blanket Query Bypass**: Running a collection group query or unscoped collection query without `userId == request.auth.uid`.

---

## 3. Test Runner Specification (`firestore.rules.test.ts`)

All 12 malicious payloads MUST be rejected by the security rules with `PERMISSION_DENIED`.
Rules are drafted first in `DRAFT_firestore.rules` and finalized in `firestore.rules`.
