# Affiliate Gamification & Recurring Commissions — Design

**Date:** 2026-04-17
**Status:** Approved for planning

## Goal

Extend the existing affiliate system (10% per customer order) with three new capabilities:

1. **Lifetime 40% recurring commission** — when a merchant refers another merchant who subscribes to a paid plan, the referrer earns 40% of every subscription invoice that referred merchant pays, for the life of the subscription.
2. **Affiliate leaderboard** — public leaderboard with custom handles, ranked by earnings across All-Time / Month / Week ranges. Seeded with mock data until real affiliates exist.
3. **Gamification** — tier system (Bronze/Silver/Gold/Platinum), one-time milestone bounties, rotating monthly challenge, and weekly tiered goals.

## Anti-abuse foundation

All tier, bounty, and goal calculations use **active referrals**, where "active" = the referred merchant has paid at least one subscription invoice. This prevents farming via fake signups. Self-referral is already blocked in `affiliateService.trackReferral`. A refund within 30 days of a subscription invoice revokes "active" status: tier recalculates down and any bounty/weekly-goal payouts triggered by that referral are marked `cancelled`.

## Data model

### Modify `AffiliateCommission`

- Add `type String @default("order")` — one of `order` | `subscription` | `bounty` | `weekly_goal`.
- Add `metadata Json?` — bounty key, ISO week, etc. for auditing.

Default keeps existing rows valid.

### Modify `Merchant`

- Add `affiliateHandle String? @unique` — public leaderboard handle (3–20 chars, `[a-zA-Z0-9_]`, case-insensitive unique).
- Add `affiliateTier String @default("bronze")` — one of `bronze` | `silver` | `gold` | `platinum`. Recalculated whenever a referred merchant becomes active or loses active status.

### New `AffiliateBountyClaim`

Tracks which one-time milestone bounties each merchant has claimed (prevents double-payout).

| Column | Type |
|---|---|
| id | String @id |
| merchantId | String (FK → Merchant) |
| bountyKey | String (e.g., `milestone_1`, `milestone_5`) |
| claimedAt | DateTime |
| commissionId | String? (FK → AffiliateCommission for audit) |

Unique index on `(merchantId, bountyKey)`.

### New `AffiliateWeeklyProgress`

Per-merchant, per-ISO-week row tracking referrals generated that week, plus which reward tiers have been paid.

| Column | Type |
|---|---|
| id | String @id |
| merchantId | String (FK → Merchant) |
| isoWeek | String (e.g., `2026-W16`) |
| referralCount | Int @default(0) |
| bronzePaid | Boolean @default(false) |
| silverPaid | Boolean @default(false) |
| goldPaid | Boolean @default(false) |
| updatedAt | DateTime @updatedAt |

Unique index on `(merchantId, isoWeek)`.

### New `AffiliateLeaderboardMock`

Seeded fake rows that appear on the public leaderboard until real affiliates outrank them.

| Column | Type |
|---|---|
| id | String @id |
| handle | String @unique |
| tier | String |
| earningsAllTime | BigInt (cents) |
| earningsMonth | BigInt (cents) |
| earningsWeek | BigInt (cents) |

Populated by `backend/scripts/seed-leaderboard-mock.ts`. Dropped in a future migration once real affiliate population makes them unnecessary.

## Config (`backend/src/config/affiliate.ts`)

Hardcoded values — change by editing this file, no admin UI.

```ts
export const AFFILIATE_TIERS = [
  { key: 'bronze',   minActiveReferrals: 0,  perOrderRate: 10 },
  { key: 'silver',   minActiveReferrals: 5,  perOrderRate: 12 },
  { key: 'gold',     minActiveReferrals: 15, perOrderRate: 15 },
  { key: 'platinum', minActiveReferrals: 30, perOrderRate: 20 },
];

export const SUBSCRIPTION_COMMISSION_RATE = 40; // flat for all tiers, lifetime

export const MILESTONE_BOUNTIES = [
  { key: 'milestone_1',  threshold: 1,  amountCents: 2500 },
  { key: 'milestone_5',  threshold: 5,  amountCents: 10000 },
  { key: 'milestone_10', threshold: 10, amountCents: 25000 },
  { key: 'milestone_25', threshold: 25, amountCents: 75000 },
  { key: 'milestone_50', threshold: 50, amountCents: 200000 },
];

export const WEEKLY_GOALS = [
  { key: 'bronze', target: 1, amountCents: 2000 },
  { key: 'silver', target: 3, amountCents: 7500 },
  { key: 'gold',   target: 5, amountCents: 15000 },
];

export const MONTHLY_CHALLENGE = {
  target: 3,              // referrals in the calendar month
  amountCents: 15000,     // $150
};

export const HANDLE_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
```

## Backend behavior

### Subscription commission (40% lifetime)

Location: wherever the Stripe `invoice.paid` webhook is already handled for merchant subscriptions (`backend/src/routes/webhooks.ts`).

Flow:
1. Resolve the paying merchant from the Stripe customer ID.
2. If `merchant.referredBy == null`, exit.
3. Create `AffiliateCommission` with:
   - `type = 'subscription'`
   - `affiliateId = merchant.referredBy`
   - `referredMerchantId = merchant.id`
   - `commissionRate = 40`
   - `amount = round(invoice.amount_paid * 0.40)` (in cents)
   - `status = 'pending'`
   - `metadata = { stripeInvoiceId }`
4. The existing 30-day holdback cron flips `pending` → `paid` for subscription rows the same way it does for order rows.

Runs on every successful invoice for life — no end date.

### Active referral detection + tier recalculation

A referred merchant becomes active on their **first paid subscription invoice**. At that moment:

1. Run the subscription-commission flow above (creates the first commission row).
2. Recompute the referrer's `affiliateTier`:
   - `activeReferralCount = count of merchants where referredBy = referrerId AND they have at least one subscription invoice status != 'refunded'`
   - Pick the highest tier whose `minActiveReferrals <= activeReferralCount`.
   - Update `Merchant.affiliateTier` if changed.
3. Evaluate milestone bounties (see below).
4. Increment weekly progress + evaluate weekly goals (see below).

### Per-order commission rate sourced from tier

`affiliateService.createCommission` (for `type='order'`) looks up the affiliate's current `affiliateTier`, reads the matching `perOrderRate` from `AFFILIATE_TIERS`, and uses that instead of the hardcoded 10%. Existing callers don't need to change — the rate lookup moves inside the service.

### Milestone bounties

Triggered inside the active-referral flow, after tier recalc:

1. Load `activeReferralCount` (just computed).
2. For each milestone in `MILESTONE_BOUNTIES` where `threshold <= activeReferralCount`:
   - If no `AffiliateBountyClaim` exists for `(referrerId, milestone.key)`, it's newly crossed.
   - Inside a transaction:
     - Create `AffiliateCommission` with `type='bounty'`, `status='paid'` (no refund risk — it's a milestone, not order revenue), `amount=milestone.amountCents`, `commissionRate=0`, `metadata={ bountyKey }`.
     - Create `AffiliateBountyClaim` row referencing the commission id.

Idempotent: the unique index on `(merchantId, bountyKey)` prevents double-payout even if the active-referral flow fires twice.

### Weekly tiered goals

Trigger: on each active-referral event.

1. Compute current ISO week string (e.g., `2026-W16`) in UTC.
2. Upsert `AffiliateWeeklyProgress` for `(referrerId, isoWeek)`, incrementing `referralCount`.
3. For each tier in `WEEKLY_GOALS`:
   - If `referralCount >= target` AND `<tier>Paid === false`:
     - Inside a transaction: create `AffiliateCommission` with `type='weekly_goal'`, `status='paid'`, `metadata={ isoWeek, goalKey }`, and set `<tier>Paid = true`.

Week rollover is automatic — a new ISO week produces a fresh row with all flags false.

### Monthly challenge

Nightly cron job (new, or folded into existing holdback cron):

- On the 1st of each month at 00:05 UTC, evaluate the *previous* month.
- For each merchant with `>= MONTHLY_CHALLENGE.target` active referrals created in the previous calendar month, create one `AffiliateCommission` with `type='bounty'`, `metadata={ monthlyChallengeMonth: 'YYYY-MM' }`, `status='paid'`, `amount = MONTHLY_CHALLENGE.amountCents`.
- Idempotency: check for an existing commission with matching `affiliateId + metadata.monthlyChallengeMonth` before inserting.

### Refund clawback

When a Stripe `charge.refunded` / `invoice.refunded` event fires for a referred merchant's subscription invoice:

1. Find the subscription `AffiliateCommission` for that invoice. Mark its `status = 'cancelled'`.
2. Re-check whether the referred merchant still has any non-refunded paid subscription invoice. If not, they drop out of "active" status:
   - Recalculate referrer's `affiliateTier` (may go down).
   - For each milestone bounty that now has `activeReferralCount < threshold`: leave the claim + commission in place (historical record) — no clawback on bounties once earned past the 30-day window. For bounties paid within the last 30 days, mark the related `AffiliateCommission.status = 'cancelled'` and delete the `AffiliateBountyClaim` row.
   - Decrement the current week's `AffiliateWeeklyProgress.referralCount`. If a goal tier that had been paid is no longer met, mark its commission `cancelled` and flip the `*Paid` flag back to false.

Edge case: commission was already in `paid` state for more than 30 days → leave as-is (we've already paid out; accept the loss; this is why 30-day holdback exists for subscription/order types).

## API endpoints

All under `backend/src/routes/affiliates.ts` (existing file).

### `GET /api/affiliates/leaderboard`

Query: `?range=all|month|week` (default `all`).

Response:
```json
{
  "range": "all",
  "top": [
    { "rank": 1, "handle": "eSIMKing", "tier": "platinum", "earnings": 8421.50, "avatarSeed": "eSIMKing" }
  ],
  "me": { "rank": 47, "handle": "ezza_w", "tier": "bronze", "earnings": 12.50, "avatarSeed": "ezza_w" }
}
```

Top 10 rows; `me` is the current user's row even if outside top 10. Mock rows are included transparently (flagged internally, not in response).

### `GET /api/affiliates/me/gamification`

Returns everything the dashboard's "Bounties & Goals" tab and hero strip need:

```json
{
  "tier": { "current": "bronze", "next": "silver", "activeReferrals": 3, "nextThreshold": 5 },
  "recurring": { "rate": 40, "activeRecurring": 2, "monthlyEstimate": 39.20 },
  "milestones": [
    { "key": "milestone_1",  "threshold": 1,  "reward": 25,   "claimedAt": "2026-03-02T..." },
    { "key": "milestone_5",  "threshold": 5,  "reward": 100,  "claimedAt": null, "progress": 3 }
  ],
  "weekly": {
    "isoWeek": "2026-W16",
    "resetsAt": "2026-04-20T00:00:00Z",
    "referralCount": 2,
    "tiers": [
      { "key": "bronze", "target": 1, "reward": 20,  "paid": true },
      { "key": "silver", "target": 3, "reward": 75,  "paid": false },
      { "key": "gold",   "target": 5, "reward": 150, "paid": false }
    ]
  },
  "monthly": {
    "month": "2026-04",
    "target": 3,
    "reward": 150,
    "progress": 2
  },
  "handle": "ezza_w"
}
```

### `PATCH /api/affiliates/me/handle`

Body: `{ "handle": "ezza_w" }`. Validates against `HANDLE_REGEX` and unique-case-insensitive. Returns `{ ok: true }` or `{ error, code }`.

## Frontend (`AffiliateDashboard.tsx`)

Existing page becomes the shell; restructure into three tabs plus hero.

### Hero strip (always visible)

- Current tier badge + progress bar to next tier ("4 more active referrals to Silver")
- Three stat cards: **Lifetime earnings** / **This month** / **Active referrals**
- Big callout: *"Earn 40% of every referred merchant's subscription — for life."*

### Tab 1 — Overview

Existing commission history table, upgraded with a type filter chip row: **All / Orders / Subscriptions / Bounties / Goals**. Reuses existing columns.

### Tab 2 — Leaderboard

Three sub-tabs: **All-Time / This Month / This Week**. For each:

- Top 10 rows: rank, avatar (generated from handle hash via DiceBear or similar, seed = handle), handle, tier badge, $ earned.
- Current user pinned at bottom (with a divider) showing their rank even if outside top 10.

Mock data: `backend/scripts/seed-leaderboard-mock.ts` creates 25 rows flagged `isMock: true` on a dedicated `AffiliateLeaderboardMock` table (simpler than flagging merchants). The leaderboard endpoint merges real commissions with mock rows and ranks them together. When real affiliates start earning, they naturally outrank mocks; we can delete the mock table later with one migration.

### Tab 3 — Bounties & Goals

- **Weekly goals card** — three progress bars (bronze/silver/gold), live ISO week label, countdown timer to Monday 00:00 UTC reset, "$X earned this week" summary.
- **Monthly challenge card** — current month target + progress bar + reward + days remaining.
- **Milestone bounties card** — vertical ladder showing all 5 milestones with checkmark + claim date for claimed ones, next uncompleted highlighted with "X more to go".

### Settings strip

One inline-editable field: **Public handle**. Live validation via `PATCH /api/affiliates/me/handle`, uniqueness check on submit, error shown inline.

### Polling

TanStack Query refetches `leaderboard` and `gamification` every 60s on this page.

## Testing

- Unit tests for tier recalculation logic (edge cases: exactly at threshold, drop after refund).
- Unit tests for weekly goal idempotency (paying out only once per tier per week).
- Unit tests for milestone idempotency (rerunning active-referral event doesn't double-pay).
- Integration test for the full Stripe invoice → subscription commission flow.
- Integration test for refund clawback.
- Frontend: leaderboard renders with mock data; handle validation works; tab switching preserves data.

## Out of scope

- Admin UI for editing bounty/goal values (config file is fine).
- Real-time push updates (60s polling is enough).
- Affiliate-to-affiliate messaging/social features.
- Multi-level / MLM-style downline commissions.
- Geographic leaderboards.
- Payout processing automation (existing manual flow stays).
