# Affiliate Gamification & Recurring Commissions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 40% lifetime recurring subscription commissions, a tier system (Bronze → Platinum), milestone bounties, weekly tiered goals, a monthly challenge, and a public leaderboard with custom handles to the existing affiliate system.

**Architecture:** Extend the existing `AffiliateCommission` model with a `type` field so all reward payouts funnel through one table and the existing payout-request flow. Hardcode tier/bounty/goal targets in `backend/src/config/affiliate.ts`. Trigger tier recalc, bounties, and weekly goals from a single `handleActiveReferral` helper called when a referred merchant's first subscription invoice is paid. Add a separate `AffiliateLeaderboardMock` table for seeded fake data.

**Tech Stack:** Prisma, Express, Zod, Stripe SDK, Vitest (backend); React + TanStack Query + Tailwind + Radix (frontend).

**Spec:** [docs/superpowers/specs/2026-04-17-affiliate-gamification-design.md](../specs/2026-04-17-affiliate-gamification-design.md)

---

## File Structure

**Backend — create:**
- `backend/src/config/affiliate.ts` — tier/bounty/goal/challenge constants
- `backend/src/services/affiliateTierService.ts` — tier recalc, active-referral hook, bounty/goal evaluation
- `backend/src/services/affiliateLeaderboardService.ts` — leaderboard aggregation + mock merge
- `backend/src/jobs/monthlyChallengeJob.ts` — month-end challenge payout
- `backend/scripts/seed-leaderboard-mock.ts` — seeds `AffiliateLeaderboardMock`
- `backend/test/affiliate/tier.test.ts`
- `backend/test/affiliate/bounty.test.ts`
- `backend/test/affiliate/weeklyGoals.test.ts`
- `backend/test/affiliate/subscriptionCommission.test.ts`
- `backend/test/affiliate/clawback.test.ts`

**Backend — modify:**
- `backend/prisma/schema.prisma` — schema additions
- `backend/src/services/affiliateService.ts` — tier-aware per-order rate, expose internal commission creation
- `backend/src/services/subscriptionService.ts` — call into recurring commission + active-referral hook
- `backend/src/services/paymentService.ts` — handle `charge.refunded` for clawback
- `backend/src/routes/affiliates.ts` — new endpoints
- `backend/src/index.ts` — register monthly challenge cron

**Frontend — create:**
- `esim-connect-hub/src/pages/affiliate/LeaderboardTab.tsx`
- `esim-connect-hub/src/pages/affiliate/BountiesGoalsTab.tsx`
- `esim-connect-hub/src/pages/affiliate/HeroStrip.tsx`
- `esim-connect-hub/src/pages/affiliate/HandleEditor.tsx`
- `esim-connect-hub/src/pages/affiliate/tierBadges.ts`

**Frontend — modify:**
- `esim-connect-hub/src/pages/AffiliateDashboard.tsx` — shell becomes tabs + hero
- `esim-connect-hub/src/lib/api.ts` — new client methods

---

## Task 1: Add Prisma schema changes

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/<timestamp>_affiliate_gamification/migration.sql` (via `prisma migrate dev`)

- [ ] **Step 1: Extend `AffiliateCommission` model**

In [backend/prisma/schema.prisma:428-452](../../../backend/prisma/schema.prisma#L428-L452), update the `AffiliateCommission` block to:

```prisma
model AffiliateCommission {
  id                 String    @id @default(uuid())
  affiliateId        String
  referredMerchantId String?
  orderId            String?
  customerOrderId    String?
  amount             BigInt
  currency           String    @default("USD")
  status             String    @default("pending") // pending, paid, cancelled
  commissionRate     Float
  type               String    @default("order") // order, subscription, bounty, weekly_goal
  metadata           Json?
  stripeInvoiceId    String?   // only for type='subscription'
  createdAt          DateTime  @default(now())
  paidAt             DateTime?

  affiliate        Merchant       @relation("AffiliateCommissions", fields: [affiliateId], references: [id], onDelete: Cascade)
  referredMerchant Merchant?      @relation("ReferredBy", fields: [referredMerchantId], references: [id], onDelete: SetNull)
  customerOrder    CustomerOrder? @relation(fields: [customerOrderId], references: [id], onDelete: SetNull)

  bountyClaim AffiliateBountyClaim?

  @@index([affiliateId])
  @@index([referredMerchantId])
  @@index([orderId])
  @@index([customerOrderId])
  @@index([status])
  @@index([createdAt])
  @@index([type])
  @@index([stripeInvoiceId])
}
```

- [ ] **Step 2: Extend `Merchant` with affiliate handle + tier**

Locate the `Merchant` model in the same file (around line 39). Add these fields near the existing `affiliateCode`/`referralCode` lines:

```prisma
  affiliateHandle String? @unique
  affiliateTier   String  @default("bronze") // bronze, silver, gold, platinum
```

And inside the relations section of `Merchant`, add:

```prisma
  bountyClaims     AffiliateBountyClaim[]
  weeklyProgress   AffiliateWeeklyProgress[]
```

- [ ] **Step 3: Add new models at the end of the file**

Append after the `AffiliateCommission` model:

```prisma
model AffiliateBountyClaim {
  id           String    @id @default(uuid())
  merchantId   String
  bountyKey    String
  claimedAt    DateTime  @default(now())
  commissionId String?   @unique

  merchant   Merchant             @relation(fields: [merchantId], references: [id], onDelete: Cascade)
  commission AffiliateCommission? @relation(fields: [commissionId], references: [id], onDelete: SetNull)

  @@unique([merchantId, bountyKey])
  @@index([merchantId])
}

model AffiliateWeeklyProgress {
  id            String   @id @default(uuid())
  merchantId    String
  isoWeek       String   // e.g., "2026-W16"
  referralCount Int      @default(0)
  bronzePaid    Boolean  @default(false)
  silverPaid    Boolean  @default(false)
  goldPaid      Boolean  @default(false)
  updatedAt     DateTime @updatedAt

  merchant Merchant @relation(fields: [merchantId], references: [id], onDelete: Cascade)

  @@unique([merchantId, isoWeek])
  @@index([merchantId])
  @@index([isoWeek])
}

model AffiliateLeaderboardMock {
  id              String @id @default(uuid())
  handle          String @unique
  tier            String
  earningsAllTime BigInt
  earningsMonth   BigInt
  earningsWeek    BigInt
}
```

- [ ] **Step 4: Generate the migration**

Run: `cd backend && npx prisma migrate dev --name affiliate_gamification`
Expected: new migration file created under `backend/prisma/migrations/`, database updated, `npx prisma generate` runs automatically.

- [ ] **Step 5: Verify compile**

Run: `cd backend && npx tsc --noEmit`
Expected: exit code 0 (new fields available on Prisma Client).

- [ ] **Step 6: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(affiliate): schema for tiers, bounties, weekly goals, leaderboard mocks"
```

---

## Task 2: Add affiliate config module

**Files:**
- Create: `backend/src/config/affiliate.ts`

- [ ] **Step 1: Write the config file**

Create `backend/src/config/affiliate.ts` with:

```ts
export type AffiliateTierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

export const AFFILIATE_TIERS: ReadonlyArray<{
  key: AffiliateTierKey;
  label: string;
  minActiveReferrals: number;
  perOrderRate: number;
}> = [
  { key: 'bronze',   label: 'Bronze',   minActiveReferrals: 0,  perOrderRate: 10 },
  { key: 'silver',   label: 'Silver',   minActiveReferrals: 5,  perOrderRate: 12 },
  { key: 'gold',     label: 'Gold',     minActiveReferrals: 15, perOrderRate: 15 },
  { key: 'platinum', label: 'Platinum', minActiveReferrals: 30, perOrderRate: 20 },
] as const;

export const SUBSCRIPTION_COMMISSION_RATE = 40; // flat for all tiers, lifetime

export const MILESTONE_BOUNTIES: ReadonlyArray<{
  key: string;
  threshold: number;
  amountCents: number;
}> = [
  { key: 'milestone_1',  threshold: 1,  amountCents: 2500 },
  { key: 'milestone_5',  threshold: 5,  amountCents: 10000 },
  { key: 'milestone_10', threshold: 10, amountCents: 25000 },
  { key: 'milestone_25', threshold: 25, amountCents: 75000 },
  { key: 'milestone_50', threshold: 50, amountCents: 200000 },
] as const;

export const WEEKLY_GOALS: ReadonlyArray<{
  key: 'bronze' | 'silver' | 'gold';
  target: number;
  amountCents: number;
}> = [
  { key: 'bronze', target: 1, amountCents: 2000 },
  { key: 'silver', target: 3, amountCents: 7500 },
  { key: 'gold',   target: 5, amountCents: 15000 },
] as const;

export const MONTHLY_CHALLENGE = {
  target: 3,
  amountCents: 15000,
} as const;

export const HANDLE_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function tierForActiveReferrals(n: number): AffiliateTierKey {
  let current: AffiliateTierKey = 'bronze';
  for (const t of AFFILIATE_TIERS) {
    if (n >= t.minActiveReferrals) current = t.key;
  }
  return current;
}

export function perOrderRateForTier(tier: AffiliateTierKey): number {
  return AFFILIATE_TIERS.find(t => t.key === tier)?.perOrderRate ?? 10;
}

/** Return the ISO week string in UTC, e.g. "2026-W16". */
export function isoWeekUTC(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Write unit tests for helpers**

Create `backend/test/affiliate/config.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { tierForActiveReferrals, perOrderRateForTier, isoWeekUTC } from '../../src/config/affiliate';

describe('tierForActiveReferrals', () => {
  it('returns bronze for 0', () => expect(tierForActiveReferrals(0)).toBe('bronze'));
  it('returns bronze for 4', () => expect(tierForActiveReferrals(4)).toBe('bronze'));
  it('returns silver for 5', () => expect(tierForActiveReferrals(5)).toBe('silver'));
  it('returns silver for 14', () => expect(tierForActiveReferrals(14)).toBe('silver'));
  it('returns gold for 15', () => expect(tierForActiveReferrals(15)).toBe('gold'));
  it('returns platinum for 30', () => expect(tierForActiveReferrals(30)).toBe('platinum'));
  it('returns platinum for 1000', () => expect(tierForActiveReferrals(1000)).toBe('platinum'));
});

describe('perOrderRateForTier', () => {
  it('bronze = 10', () => expect(perOrderRateForTier('bronze')).toBe(10));
  it('silver = 12', () => expect(perOrderRateForTier('silver')).toBe(12));
  it('gold = 15', () => expect(perOrderRateForTier('gold')).toBe(15));
  it('platinum = 20', () => expect(perOrderRateForTier('platinum')).toBe(20));
});

describe('isoWeekUTC', () => {
  it('computes week for 2026-04-17 (Friday of W16)', () => {
    expect(isoWeekUTC(new Date(Date.UTC(2026, 3, 17)))).toBe('2026-W16');
  });
  it('computes week for 2026-01-01 (Thursday of W01)', () => {
    expect(isoWeekUTC(new Date(Date.UTC(2026, 0, 1)))).toBe('2026-W01');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `cd backend && npx vitest run test/affiliate/config.test.ts`
Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/config/affiliate.ts backend/test/affiliate/config.test.ts
git commit -m "feat(affiliate): config constants for tiers, bounties, weekly goals, challenge"
```

---

## Task 3: Tier-aware per-order commission rate

Replace the hardcoded `env.affiliateCommissionRate` used by per-order commissions with a tier lookup in `affiliateService.createCommission`.

**Files:**
- Modify: `backend/src/services/affiliateService.ts`
- Modify: `backend/src/services/customerOrderService.ts:253-270`

- [ ] **Step 1: Write failing test for tier-based rate**

Create `backend/test/affiliate/tier.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { affiliateService } from '../../src/services/affiliateService';

describe('affiliateService.createCommission (type=order)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('uses per-order rate matching the affiliate tier', async () => {
    vi.spyOn(prisma.merchant, 'findUnique').mockResolvedValue({
      id: 'm1',
      affiliateTier: 'gold',
    } as any);
    const createSpy = vi.spyOn(prisma.affiliateCommission, 'create').mockResolvedValue({} as any);

    await affiliateService.createCommission({
      affiliateId: 'm1',
      customerOrderId: 'o1',
      amount: 10000,
      type: 'order',
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          commissionRate: 15,
          amount: BigInt(1500),
          type: 'order',
        }),
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/affiliate/tier.test.ts`
Expected: FAIL — current signature rejects `type`, and there is no tier lookup.

- [ ] **Step 3: Update `createCommission` to accept `type` and infer rate from tier**

In `backend/src/services/affiliateService.ts`, replace the `createCommission` method with:

```ts
  async createCommission(params: {
    affiliateId: string;
    referredMerchantId?: string;
    customerOrderId?: string;
    amount: number; // cents — for order/subscription, this is the gross; for bounty/weekly_goal, this is the reward itself
    type: 'order' | 'subscription' | 'bounty' | 'weekly_goal';
    commissionRate?: number; // override; otherwise derived from tier (order) or config (subscription) or 0 (bounty/goal)
    currency?: string;
    status?: 'pending' | 'paid' | 'cancelled';
    metadata?: Record<string, any>;
    stripeInvoiceId?: string;
  }) {
    const {
      affiliateId,
      referredMerchantId,
      customerOrderId,
      amount,
      type,
      currency = 'USD',
      metadata,
      stripeInvoiceId,
    } = params;

    let rate = params.commissionRate;
    let commissionAmount: number;

    if (type === 'order') {
      if (rate === undefined) {
        const { perOrderRateForTier } = await import('../config/affiliate');
        const merchant = await prisma.merchant.findUnique({
          where: { id: affiliateId },
          select: { affiliateTier: true },
        });
        rate = perOrderRateForTier((merchant?.affiliateTier as any) || 'bronze');
      }
      commissionAmount = Math.round(amount * (rate / 100));
    } else if (type === 'subscription') {
      if (rate === undefined) {
        const { SUBSCRIPTION_COMMISSION_RATE } = await import('../config/affiliate');
        rate = SUBSCRIPTION_COMMISSION_RATE;
      }
      commissionAmount = Math.round(amount * (rate / 100));
    } else {
      // bounty / weekly_goal — amount is the literal reward
      rate = rate ?? 0;
      commissionAmount = amount;
    }

    const status = params.status ?? (type === 'bounty' || type === 'weekly_goal' ? 'paid' : 'pending');

    return prisma.affiliateCommission.create({
      data: {
        affiliateId,
        referredMerchantId: referredMerchantId ?? null,
        customerOrderId: customerOrderId ?? null,
        amount: BigInt(commissionAmount),
        currency,
        commissionRate: rate,
        status,
        paidAt: status === 'paid' ? new Date() : null,
        type,
        metadata: metadata ?? undefined,
        stripeInvoiceId: stripeInvoiceId ?? null,
      },
    });
  },
```

- [ ] **Step 4: Update the only existing caller (customer order flow)**

In [backend/src/services/customerOrderService.ts:253-270](../../../backend/src/services/customerOrderService.ts#L253-L270), replace the `affiliateService.createCommission({ ... })` call to drop `commissionRate` and add `type`:

```ts
await affiliateService.createCommission({
  affiliateId: affiliateMerchantId,
  customerOrderId: order.id,
  amount: orderTotalCents,
  type: 'order',
  // commissionRate omitted — derived from tier
});
```

(Exact surrounding context depends on current code; preserve existing conditions and referredMerchantId wiring.)

- [ ] **Step 5: Run test to verify it passes**

Run: `cd backend && npx vitest run test/affiliate/tier.test.ts`
Expected: PASS.

- [ ] **Step 6: Verify compile + existing tests**

Run: `cd backend && npx tsc --noEmit && npx vitest run`
Expected: no type errors; existing tests still pass.

- [ ] **Step 7: Commit**

```bash
git add backend/src/services/affiliateService.ts backend/src/services/customerOrderService.ts backend/test/affiliate/tier.test.ts
git commit -m "feat(affiliate): tier-aware per-order commission rate"
```

---

## Task 4: Active-referral hook + tier recalc

A single `handleActiveReferral(referredMerchantId, referrerId)` function recomputes tier, pays milestone bounties, and updates weekly progress. Called from subscription invoice handler in Task 5.

**Files:**
- Create: `backend/src/services/affiliateTierService.ts`
- Create: `backend/test/affiliate/tierRecalc.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/test/affiliate/tierRecalc.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { recalculateTier, countActiveReferrals } from '../../src/services/affiliateTierService';

describe('affiliateTierService.recalculateTier', () => {
  let referrerId: string;

  beforeEach(async () => {
    const m = await prisma.merchant.create({
      data: { email: `ref-${Date.now()}@x.test`, password: 'x', affiliateTier: 'bronze' },
    });
    referrerId = m.id;
  });

  afterEach(async () => {
    await prisma.merchant.deleteMany({ where: { id: referrerId } });
  });

  it('keeps bronze with 0 active referrals', async () => {
    expect(await countActiveReferrals(referrerId)).toBe(0);
    expect(await recalculateTier(referrerId)).toBe('bronze');
  });

  it('promotes to silver at 5 active referrals', async () => {
    for (let i = 0; i < 5; i++) {
      const refd = await prisma.merchant.create({
        data: { email: `refd-${i}-${Date.now()}@x.test`, password: 'x', referredBy: referrerId },
      });
      await prisma.affiliateCommission.create({
        data: {
          affiliateId: referrerId,
          referredMerchantId: refd.id,
          amount: BigInt(1000),
          commissionRate: 40,
          type: 'subscription',
          status: 'paid',
        },
      });
    }
    expect(await countActiveReferrals(referrerId)).toBe(5);
    expect(await recalculateTier(referrerId)).toBe('silver');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/affiliate/tierRecalc.test.ts`
Expected: FAIL — service doesn't exist yet.

- [ ] **Step 3: Implement `affiliateTierService`**

Create `backend/src/services/affiliateTierService.ts`:

```ts
import { prisma } from '../lib/prisma';
import {
  tierForActiveReferrals,
  MILESTONE_BOUNTIES,
  WEEKLY_GOALS,
  isoWeekUTC,
  type AffiliateTierKey,
} from '../config/affiliate';
import { affiliateService } from './affiliateService';

/**
 * An "active referral" is a referred merchant who has at least one
 * non-cancelled subscription commission on file. We use the commission
 * table as proof-of-subscription to avoid coupling to Stripe state.
 */
export async function countActiveReferrals(referrerId: string): Promise<number> {
  const rows = await prisma.affiliateCommission.findMany({
    where: {
      affiliateId: referrerId,
      type: 'subscription',
      status: { not: 'cancelled' },
      referredMerchantId: { not: null },
    },
    select: { referredMerchantId: true },
    distinct: ['referredMerchantId'],
  });
  return rows.length;
}

export async function recalculateTier(referrerId: string): Promise<AffiliateTierKey> {
  const count = await countActiveReferrals(referrerId);
  const newTier = tierForActiveReferrals(count);
  await prisma.merchant.update({
    where: { id: referrerId },
    data: { affiliateTier: newTier },
  });
  return newTier;
}

async function evaluateMilestoneBounties(referrerId: string, activeCount: number) {
  for (const m of MILESTONE_BOUNTIES) {
    if (m.threshold > activeCount) continue;
    const existing = await prisma.affiliateBountyClaim.findUnique({
      where: { merchantId_bountyKey: { merchantId: referrerId, bountyKey: m.key } },
    });
    if (existing) continue;

    await prisma.$transaction(async (tx) => {
      const commission = await tx.affiliateCommission.create({
        data: {
          affiliateId: referrerId,
          amount: BigInt(m.amountCents),
          currency: 'USD',
          commissionRate: 0,
          status: 'paid',
          paidAt: new Date(),
          type: 'bounty',
          metadata: { bountyKey: m.key, threshold: m.threshold },
        },
      });
      await tx.affiliateBountyClaim.create({
        data: {
          merchantId: referrerId,
          bountyKey: m.key,
          commissionId: commission.id,
        },
      });
    });
  }
}

async function incrementWeeklyProgress(referrerId: string) {
  const isoWeek = isoWeekUTC();

  const row = await prisma.affiliateWeeklyProgress.upsert({
    where: { merchantId_isoWeek: { merchantId: referrerId, isoWeek } },
    create: { merchantId: referrerId, isoWeek, referralCount: 1 },
    update: { referralCount: { increment: 1 } },
  });

  for (const tier of WEEKLY_GOALS) {
    const paidField = `${tier.key}Paid` as 'bronzePaid' | 'silverPaid' | 'goldPaid';
    if (row[paidField] || row.referralCount < tier.target) continue;

    await prisma.$transaction(async (tx) => {
      await tx.affiliateCommission.create({
        data: {
          affiliateId: referrerId,
          amount: BigInt(tier.amountCents),
          currency: 'USD',
          commissionRate: 0,
          status: 'paid',
          paidAt: new Date(),
          type: 'weekly_goal',
          metadata: { isoWeek, goalKey: tier.key, target: tier.target },
        },
      });
      await tx.affiliateWeeklyProgress.update({
        where: { merchantId_isoWeek: { merchantId: referrerId, isoWeek } },
        data: { [paidField]: true },
      });
    });
  }
}

/**
 * Called when a referred merchant's first subscription invoice is paid.
 * Recomputes tier, pays out milestone bounties, updates weekly progress.
 */
export async function handleActiveReferral(referrerId: string) {
  const activeCount = await countActiveReferrals(referrerId);
  await recalculateTier(referrerId);
  await evaluateMilestoneBounties(referrerId, activeCount);
  await incrementWeeklyProgress(referrerId);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npx vitest run test/affiliate/tierRecalc.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/affiliateTierService.ts backend/test/affiliate/tierRecalc.test.ts
git commit -m "feat(affiliate): tier recalc + active-referral hook"
```

---

## Task 5: Subscription commission from invoice.paid

Hook the subscription commission flow into `subscriptionService.handleInvoiceWebhook`.

**Files:**
- Modify: `backend/src/services/subscriptionService.ts:415-458`
- Create: `backend/test/affiliate/subscriptionCommission.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/test/affiliate/subscriptionCommission.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { handleSubscriptionInvoicePaid } from '../../src/services/subscriptionService';

describe('handleSubscriptionInvoicePaid', () => {
  let referrerId: string;
  let referredId: string;

  beforeEach(async () => {
    const ref = await prisma.merchant.create({ data: { email: `r-${Date.now()}@x.test`, password: 'x' } });
    referrerId = ref.id;
    const rd = await prisma.merchant.create({ data: { email: `rd-${Date.now()}@x.test`, password: 'x', referredBy: referrerId } });
    referredId = rd.id;
  });

  afterEach(async () => {
    await prisma.affiliateCommission.deleteMany({ where: { OR: [{ affiliateId: referrerId }, { referredMerchantId: referredId }] } });
    await prisma.merchant.deleteMany({ where: { id: { in: [referrerId, referredId] } } });
  });

  it('creates a pending 40% subscription commission', async () => {
    await handleSubscriptionInvoicePaid({
      merchantId: referredId,
      stripeInvoiceId: 'inv_test_1',
      amountPaidCents: 4900,
    });

    const commissions = await prisma.affiliateCommission.findMany({
      where: { affiliateId: referrerId, type: 'subscription' },
    });
    expect(commissions).toHaveLength(1);
    expect(Number(commissions[0].amount)).toBe(1960); // 40% of 4900
    expect(commissions[0].status).toBe('pending');
    expect(commissions[0].commissionRate).toBe(40);
  });

  it('is idempotent on the same stripeInvoiceId', async () => {
    await handleSubscriptionInvoicePaid({ merchantId: referredId, stripeInvoiceId: 'inv_test_2', amountPaidCents: 4900 });
    await handleSubscriptionInvoicePaid({ merchantId: referredId, stripeInvoiceId: 'inv_test_2', amountPaidCents: 4900 });
    const commissions = await prisma.affiliateCommission.findMany({ where: { stripeInvoiceId: 'inv_test_2' } });
    expect(commissions).toHaveLength(1);
  });

  it('no-ops when referred merchant has no referrer', async () => {
    const standalone = await prisma.merchant.create({ data: { email: `s-${Date.now()}@x.test`, password: 'x' } });
    await handleSubscriptionInvoicePaid({ merchantId: standalone.id, stripeInvoiceId: 'inv_test_3', amountPaidCents: 4900 });
    const commissions = await prisma.affiliateCommission.findMany({ where: { stripeInvoiceId: 'inv_test_3' } });
    expect(commissions).toHaveLength(0);
    await prisma.merchant.delete({ where: { id: standalone.id } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/affiliate/subscriptionCommission.test.ts`
Expected: FAIL — function doesn't exist.

- [ ] **Step 3: Implement + wire into invoice webhook**

In `backend/src/services/subscriptionService.ts`, add at the top of the module (after imports):

```ts
import { affiliateService } from './affiliateService';
import { handleActiveReferral } from './affiliateTierService';
```

Add a new exported function inside the service object:

```ts
  /**
   * Create a lifetime 40% commission for the referrer when a subscription invoice is paid.
   * Idempotent on stripeInvoiceId. Triggers tier/bounty/goal recalc only on the merchant's
   * FIRST ever subscription invoice (transition from inactive → active referral).
   */
  async handleSubscriptionInvoicePaid(params: {
    merchantId: string;
    stripeInvoiceId: string;
    amountPaidCents: number;
  }): Promise<void> {
    const { merchantId, stripeInvoiceId, amountPaidCents } = params;
    if (amountPaidCents <= 0) return;

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { referredBy: true },
    });
    if (!merchant?.referredBy) return;

    const existing = await prisma.affiliateCommission.findFirst({
      where: { stripeInvoiceId, type: 'subscription' },
      select: { id: true },
    });
    if (existing) return;

    const priorActive = await prisma.affiliateCommission.count({
      where: {
        affiliateId: merchant.referredBy,
        referredMerchantId: merchantId,
        type: 'subscription',
        status: { not: 'cancelled' },
      },
    });

    await affiliateService.createCommission({
      affiliateId: merchant.referredBy,
      referredMerchantId: merchantId,
      amount: amountPaidCents,
      type: 'subscription',
      stripeInvoiceId,
      metadata: { stripeInvoiceId },
    });

    if (priorActive === 0) {
      await handleActiveReferral(merchant.referredBy);
    }
  },
```

Export it as a standalone for easier testing by adding at the bottom of the file:

```ts
export const handleSubscriptionInvoicePaid = subscriptionService.handleSubscriptionInvoicePaid.bind(subscriptionService);
```

(Adjust to match the file's existing export style — `subscriptionService` is the object being exported. If Prisma client type inference requires `this` binding, export as an arrow wrapper instead.)

- [ ] **Step 4: Call from invoice webhook**

Inside `handleInvoiceWebhook` in the same file, after the existing `prisma.invoice.upsert(...)` block (line ~457), add:

```ts
    if (invoice.status === 'paid' && invoice.amount_paid > 0) {
      await subscriptionService.handleSubscriptionInvoicePaid({
        merchantId: dbSubscription.merchantId,
        stripeInvoiceId: invoice.id!,
        amountPaidCents: invoice.amount_paid,
      });
    }
```

- [ ] **Step 5: Run tests**

Run: `cd backend && npx vitest run test/affiliate/subscriptionCommission.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/subscriptionService.ts backend/test/affiliate/subscriptionCommission.test.ts
git commit -m "feat(affiliate): 40% lifetime subscription commission on invoice.paid"
```

---

## Task 6: Refund clawback

**Files:**
- Modify: `backend/src/services/subscriptionService.ts`
- Modify: `backend/src/services/paymentService.ts` (or wherever Stripe webhook events dispatch)
- Create: `backend/test/affiliate/clawback.test.ts`

- [ ] **Step 1: Write failing test**

Create `backend/test/affiliate/clawback.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { handleSubscriptionInvoicePaid, handleSubscriptionInvoiceRefunded } from '../../src/services/subscriptionService';

describe('handleSubscriptionInvoiceRefunded', () => {
  let referrerId: string;
  let referredId: string;

  beforeEach(async () => {
    const ref = await prisma.merchant.create({ data: { email: `r-${Date.now()}@x.test`, password: 'x' } });
    referrerId = ref.id;
    const rd = await prisma.merchant.create({ data: { email: `rd-${Date.now()}@x.test`, password: 'x', referredBy: referrerId } });
    referredId = rd.id;
    await handleSubscriptionInvoicePaid({ merchantId: referredId, stripeInvoiceId: 'inv_cb_1', amountPaidCents: 4900 });
  });

  afterEach(async () => {
    await prisma.affiliateCommission.deleteMany({ where: { OR: [{ affiliateId: referrerId }, { referredMerchantId: referredId }] } });
    await prisma.affiliateBountyClaim.deleteMany({ where: { merchantId: referrerId } });
    await prisma.affiliateWeeklyProgress.deleteMany({ where: { merchantId: referrerId } });
    await prisma.merchant.deleteMany({ where: { id: { in: [referrerId, referredId] } } });
  });

  it('cancels the subscription commission', async () => {
    await handleSubscriptionInvoiceRefunded({ stripeInvoiceId: 'inv_cb_1' });
    const c = await prisma.affiliateCommission.findFirst({ where: { stripeInvoiceId: 'inv_cb_1' } });
    expect(c?.status).toBe('cancelled');
  });

  it('demotes tier when all subscription commissions for the referred merchant are cancelled', async () => {
    await handleSubscriptionInvoiceRefunded({ stripeInvoiceId: 'inv_cb_1' });
    const referrer = await prisma.merchant.findUnique({ where: { id: referrerId } });
    expect(referrer?.affiliateTier).toBe('bronze');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npx vitest run test/affiliate/clawback.test.ts`
Expected: FAIL — `handleSubscriptionInvoiceRefunded` doesn't exist.

- [ ] **Step 3: Implement clawback**

Add to `subscriptionService.ts`:

```ts
  /**
   * Clawback when a subscription invoice is refunded.
   * - Marks the subscription commission as cancelled
   * - Recalculates referrer's tier (may demote)
   * - Cancels bounty claims that were earned in the past 30 days if threshold no longer met
   * - Decrements weekly progress; cancels any paid weekly_goal commissions that are no longer valid
   */
  async handleSubscriptionInvoiceRefunded(params: { stripeInvoiceId: string }): Promise<void> {
    const commission = await prisma.affiliateCommission.findFirst({
      where: { stripeInvoiceId: params.stripeInvoiceId, type: 'subscription' },
    });
    if (!commission || commission.status === 'cancelled') return;

    await prisma.affiliateCommission.update({
      where: { id: commission.id },
      data: { status: 'cancelled' },
    });

    const referrerId = commission.affiliateId;
    const referredId = commission.referredMerchantId;

    const { countActiveReferrals, recalculateTier } = await import('./affiliateTierService');
    const { MILESTONE_BOUNTIES, WEEKLY_GOALS, isoWeekUTC } = await import('../config/affiliate');

    // Recompute referrer's active-referral count
    const activeCount = await countActiveReferrals(referrerId);
    await recalculateTier(referrerId);

    // Clawback milestone bounties claimed within last 30 days that are now above the threshold
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentClaims = await prisma.affiliateBountyClaim.findMany({
      where: { merchantId: referrerId, claimedAt: { gte: cutoff } },
      include: { commission: true },
    });
    for (const claim of recentClaims) {
      const milestone = MILESTONE_BOUNTIES.find(m => m.key === claim.bountyKey);
      if (!milestone) continue;
      if (activeCount < milestone.threshold) {
        await prisma.$transaction(async (tx) => {
          if (claim.commissionId) {
            await tx.affiliateCommission.update({
              where: { id: claim.commissionId },
              data: { status: 'cancelled' },
            });
          }
          await tx.affiliateBountyClaim.delete({ where: { id: claim.id } });
        });
      }
    }

    // Decrement this week's progress if the referral counted this week
    if (referredId && commission.createdAt) {
      const week = isoWeekUTC(commission.createdAt);
      const progress = await prisma.affiliateWeeklyProgress.findUnique({
        where: { merchantId_isoWeek: { merchantId: referrerId, isoWeek: week } },
      });
      if (progress && progress.referralCount > 0) {
        const newCount = progress.referralCount - 1;
        const updates: any = { referralCount: newCount };
        for (const tier of WEEKLY_GOALS) {
          const paidField = `${tier.key}Paid` as 'bronzePaid' | 'silverPaid' | 'goldPaid';
          if ((progress as any)[paidField] && newCount < tier.target) {
            updates[paidField] = false;
            const goalCommission = await prisma.affiliateCommission.findFirst({
              where: {
                affiliateId: referrerId,
                type: 'weekly_goal',
                status: 'paid',
                metadata: { path: ['isoWeek'], equals: week },
              },
            });
            if (goalCommission && (goalCommission.metadata as any)?.goalKey === tier.key) {
              await prisma.affiliateCommission.update({
                where: { id: goalCommission.id },
                data: { status: 'cancelled' },
              });
            }
          }
        }
        await prisma.affiliateWeeklyProgress.update({
          where: { merchantId_isoWeek: { merchantId: referrerId, isoWeek: week } },
          data: updates,
        });
      }
    }
  },
```

Export alongside `handleSubscriptionInvoicePaid`:

```ts
export const handleSubscriptionInvoiceRefunded = subscriptionService.handleSubscriptionInvoiceRefunded.bind(subscriptionService);
```

- [ ] **Step 4: Wire into Stripe webhook dispatcher**

In `backend/src/services/paymentService.ts`, locate the Stripe event switch (near the `invoice.paid` case, ~line 147). Add a case for `charge.refunded` and `invoice.refunded` that calls the new function. If `paymentService` already routes invoice events to `subscriptionService.handleInvoiceWebhook`, extend that handler to also dispatch refunds when `invoice.status === 'void'` or `amount_remaining > 0` after a prior paid state. Simplest addition:

```ts
// inside the event switch in paymentService.ts
case 'charge.refunded': {
  const charge = event.data.object as Stripe.Charge;
  if (charge.invoice) {
    const invoiceId = typeof charge.invoice === 'string' ? charge.invoice : charge.invoice.id;
    await subscriptionService.handleSubscriptionInvoiceRefunded({ stripeInvoiceId: invoiceId });
  }
  break;
}
```

Add the case to the outer switch's route list (`'charge.refunded'`) if there is an allowlist.

- [ ] **Step 5: Run tests**

Run: `cd backend && npx vitest run test/affiliate/clawback.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/subscriptionService.ts backend/src/services/paymentService.ts backend/test/affiliate/clawback.test.ts
git commit -m "feat(affiliate): refund clawback for subscription commissions, bounties, goals"
```

---

## Task 7: Monthly challenge cron

**Files:**
- Create: `backend/src/jobs/monthlyChallengeJob.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Implement the job**

Create `backend/src/jobs/monthlyChallengeJob.ts`:

```ts
import { prisma } from '../lib/prisma';
import { MONTHLY_CHALLENGE } from '../config/affiliate';

/**
 * Evaluates last completed calendar month. Idempotent per (affiliateId, month).
 * Run daily; it only acts on the 1st of a month at 00:05 UTC (or if a prior run
 * was missed and the prior month still has no payout row).
 */
export async function runMonthlyChallengeJob(now: Date = new Date()): Promise<void> {
  const prevMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const monthKey = `${prevMonthDate.getUTCFullYear()}-${String(prevMonthDate.getUTCMonth() + 1).padStart(2, '0')}`;
  const start = new Date(Date.UTC(prevMonthDate.getUTCFullYear(), prevMonthDate.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  // For every merchant, count active referrals created in the month window
  const referralsInMonth = await prisma.affiliateCommission.groupBy({
    by: ['affiliateId'],
    where: {
      type: 'subscription',
      status: { not: 'cancelled' },
      createdAt: { gte: start, lt: end },
    },
    _count: { referredMerchantId: true },
  });

  for (const row of referralsInMonth) {
    // Count distinct referred merchants for this affiliate in the window
    const distinctReferred = await prisma.affiliateCommission.findMany({
      where: {
        affiliateId: row.affiliateId,
        type: 'subscription',
        status: { not: 'cancelled' },
        createdAt: { gte: start, lt: end },
      },
      distinct: ['referredMerchantId'],
      select: { referredMerchantId: true },
    });
    if (distinctReferred.length < MONTHLY_CHALLENGE.target) continue;

    const alreadyPaid = await prisma.affiliateCommission.findFirst({
      where: {
        affiliateId: row.affiliateId,
        type: 'bounty',
        metadata: { path: ['monthlyChallengeMonth'], equals: monthKey },
      },
    });
    if (alreadyPaid) continue;

    await prisma.affiliateCommission.create({
      data: {
        affiliateId: row.affiliateId,
        amount: BigInt(MONTHLY_CHALLENGE.amountCents),
        currency: 'USD',
        commissionRate: 0,
        status: 'paid',
        paidAt: new Date(),
        type: 'bounty',
        metadata: { monthlyChallengeMonth: monthKey, target: MONTHLY_CHALLENGE.target },
      },
    });
  }
}
```

- [ ] **Step 2: Register a daily interval in index.ts**

In `backend/src/index.ts`, near the other `setInterval` usage (look for `scheduled cleanup`), add:

```ts
import { runMonthlyChallengeJob } from './jobs/monthlyChallengeJob';

// Run monthly challenge evaluation every 6 hours; internal idempotency makes this safe.
setInterval(() => {
  runMonthlyChallengeJob().catch((err) => logger.error({ err }, 'monthly challenge job failed'));
}, 6 * 60 * 60 * 1000);

// Also run once on startup so missed months get paid out after a deploy
runMonthlyChallengeJob().catch((err) => logger.error({ err }, 'monthly challenge initial run failed'));
```

- [ ] **Step 3: Test idempotency manually**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/jobs/monthlyChallengeJob.ts backend/src/index.ts
git commit -m "feat(affiliate): monthly challenge cron with idempotent payouts"
```

---

## Task 8: Leaderboard service + endpoints

**Files:**
- Create: `backend/src/services/affiliateLeaderboardService.ts`
- Modify: `backend/src/routes/affiliates.ts`

- [ ] **Step 1: Implement leaderboard service**

Create `backend/src/services/affiliateLeaderboardService.ts`:

```ts
import { prisma } from '../lib/prisma';
import { isoWeekUTC } from '../config/affiliate';

type Range = 'all' | 'month' | 'week';

type LeaderboardRow = {
  rank: number;
  handle: string;
  tier: string;
  earnings: number; // dollars
  avatarSeed: string;
  isMe?: boolean;
};

function windowStart(range: Range, now: Date = new Date()): Date | null {
  if (range === 'all') return null;
  if (range === 'month') return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  if (range === 'week') {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - (day - 1));
    return d;
  }
  return null;
}

export async function getLeaderboard(range: Range, currentMerchantId: string): Promise<{
  range: Range;
  top: LeaderboardRow[];
  me: LeaderboardRow | null;
}> {
  const start = windowStart(range);

  // Aggregate real earnings per merchant where status='paid'
  const real = await prisma.affiliateCommission.groupBy({
    by: ['affiliateId'],
    where: {
      status: 'paid',
      ...(start ? { paidAt: { gte: start } } : {}),
    },
    _sum: { amount: true },
  });

  const merchantIds = real.map(r => r.affiliateId);
  const merchants = await prisma.merchant.findMany({
    where: { id: { in: merchantIds } },
    select: { id: true, affiliateHandle: true, affiliateTier: true },
  });
  const merchantMap = new Map(merchants.map(m => [m.id, m]));

  const realRows = real
    .map(r => {
      const m = merchantMap.get(r.affiliateId);
      if (!m?.affiliateHandle) return null;
      return {
        handle: m.affiliateHandle,
        tier: m.affiliateTier,
        earnings: Number(r._sum.amount ?? 0n) / 100,
        avatarSeed: m.affiliateHandle,
        affiliateId: r.affiliateId,
      };
    })
    .filter(Boolean) as Array<LeaderboardRow & { affiliateId: string }>;

  // Merge mocks
  const mocks = await prisma.affiliateLeaderboardMock.findMany();
  const mockField = range === 'all' ? 'earningsAllTime' : range === 'month' ? 'earningsMonth' : 'earningsWeek';
  const mockRows = mocks.map(m => ({
    handle: m.handle,
    tier: m.tier,
    earnings: Number((m as any)[mockField]) / 100,
    avatarSeed: m.handle,
    affiliateId: null as string | null,
  }));

  const combined = [...realRows, ...mockRows]
    .filter(r => r.earnings > 0)
    .sort((a, b) => b.earnings - a.earnings)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  const top = combined.slice(0, 10).map(({ affiliateId, ...row }) => ({
    ...row,
    isMe: affiliateId === currentMerchantId,
  }));

  const meRow = combined.find(r => r.affiliateId === currentMerchantId);
  const me: LeaderboardRow | null = meRow
    ? { rank: meRow.rank, handle: meRow.handle, tier: meRow.tier, earnings: meRow.earnings, avatarSeed: meRow.avatarSeed, isMe: true }
    : null;

  return { range, top, me };
}
```

- [ ] **Step 2: Add the endpoint**

In `backend/src/routes/affiliates.ts`, after the existing `/stats` route, add:

```ts
router.get('/leaderboard', async (req, res) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const rangeRaw = (req.query.range as string) || 'all';
    const range = (['all', 'month', 'week'].includes(rangeRaw) ? rangeRaw : 'all') as 'all' | 'month' | 'week';
    const { getLeaderboard } = await import('../services/affiliateLeaderboardService');
    const data = await getLeaderboard(range, merchantId);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errorCode: 'LEADERBOARD_FAILED',
      errorMessage: error.message || 'Failed to fetch leaderboard',
    });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/affiliateLeaderboardService.ts backend/src/routes/affiliates.ts
git commit -m "feat(affiliate): leaderboard endpoint with mock merging"
```

---

## Task 9: Gamification + handle endpoints

**Files:**
- Modify: `backend/src/routes/affiliates.ts`

- [ ] **Step 1: Add `GET /me/gamification`**

Append in `affiliates.ts`:

```ts
router.get('/me/gamification', async (req, res) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const { prisma } = await import('../lib/prisma');
    const {
      AFFILIATE_TIERS,
      SUBSCRIPTION_COMMISSION_RATE,
      MILESTONE_BOUNTIES,
      WEEKLY_GOALS,
      MONTHLY_CHALLENGE,
      isoWeekUTC,
    } = await import('../config/affiliate');
    const { countActiveReferrals } = await import('../services/affiliateTierService');

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { affiliateTier: true, affiliateHandle: true },
    });

    const activeReferrals = await countActiveReferrals(merchantId);
    const currentTierIdx = AFFILIATE_TIERS.findIndex(t => t.key === (merchant?.affiliateTier ?? 'bronze'));
    const nextTier = AFFILIATE_TIERS[currentTierIdx + 1] ?? null;

    // Recurring estimate: sum of last 30 days paid subscription commissions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recent = await prisma.affiliateCommission.aggregate({
      where: { affiliateId: merchantId, type: 'subscription', status: { not: 'cancelled' }, createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    });
    const activeRecurring = await prisma.affiliateCommission.findMany({
      where: { affiliateId: merchantId, type: 'subscription', status: { not: 'cancelled' } },
      distinct: ['referredMerchantId'],
      select: { referredMerchantId: true },
    });

    const claims = await prisma.affiliateBountyClaim.findMany({ where: { merchantId } });
    const claimMap = new Map(claims.map(c => [c.bountyKey, c]));

    const milestones = MILESTONE_BOUNTIES.map(m => ({
      key: m.key,
      threshold: m.threshold,
      reward: m.amountCents / 100,
      claimedAt: claimMap.get(m.key)?.claimedAt ?? null,
      progress: activeReferrals,
    }));

    const isoWeek = isoWeekUTC();
    const weekly = await prisma.affiliateWeeklyProgress.findUnique({
      where: { merchantId_isoWeek: { merchantId, isoWeek } },
    });
    const weekly_ = {
      isoWeek,
      resetsAt: (() => {
        const d = new Date();
        const day = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + (8 - day));
        d.setUTCHours(0, 0, 0, 0);
        return d.toISOString();
      })(),
      referralCount: weekly?.referralCount ?? 0,
      tiers: WEEKLY_GOALS.map(t => ({
        key: t.key,
        target: t.target,
        reward: t.amountCents / 100,
        paid: !!(weekly && (weekly as any)[`${t.key}Paid`]),
      })),
    };

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthlyCount = await prisma.affiliateCommission.findMany({
      where: { affiliateId: merchantId, type: 'subscription', status: { not: 'cancelled' }, createdAt: { gte: monthStart } },
      distinct: ['referredMerchantId'],
      select: { referredMerchantId: true },
    });

    res.json({
      success: true,
      data: {
        tier: {
          current: merchant?.affiliateTier ?? 'bronze',
          next: nextTier?.key ?? null,
          activeReferrals,
          nextThreshold: nextTier?.minActiveReferrals ?? null,
        },
        recurring: {
          rate: SUBSCRIPTION_COMMISSION_RATE,
          activeRecurring: activeRecurring.length,
          monthlyEstimate: Number(recent._sum.amount ?? 0n) / 100,
        },
        milestones,
        weekly: weekly_,
        monthly: {
          month: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`,
          target: MONTHLY_CHALLENGE.target,
          reward: MONTHLY_CHALLENGE.amountCents / 100,
          progress: monthlyCount.length,
        },
        handle: merchant?.affiliateHandle ?? null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, errorCode: 'GAMIFICATION_FAILED', errorMessage: error.message });
  }
});
```

- [ ] **Step 2: Add `PATCH /me/handle`**

```ts
router.patch('/me/handle', async (req, res) => {
  try {
    const merchantId = (req as any).merchant!.id;
    const { HANDLE_REGEX } = await import('../config/affiliate');
    const schema = z.object({ handle: z.string().regex(HANDLE_REGEX, 'Handle must be 3–20 chars, letters/numbers/underscore only') });
    const { handle } = schema.parse(req.body);

    const { prisma } = await import('../lib/prisma');
    const existing = await prisma.merchant.findFirst({
      where: { affiliateHandle: { equals: handle, mode: 'insensitive' }, NOT: { id: merchantId } },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ success: false, errorCode: 'HANDLE_TAKEN', errorMessage: 'That handle is already taken' });
    }
    await prisma.merchant.update({ where: { id: merchantId }, data: { affiliateHandle: handle } });
    res.json({ success: true, data: { handle } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errorCode: 'VALIDATION_ERROR', errorMessage: error.errors[0].message });
    }
    res.status(500).json({ success: false, errorCode: 'HANDLE_UPDATE_FAILED', errorMessage: error.message });
  }
});
```

- [ ] **Step 3: Run typecheck**

Run: `cd backend && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/affiliates.ts
git commit -m "feat(affiliate): gamification + handle endpoints"
```

---

## Task 10: Mock leaderboard seed script

**Files:**
- Create: `backend/scripts/seed-leaderboard-mock.ts`

- [ ] **Step 1: Write the seed script**

```ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const handles = [
  { handle: 'eSIMKing',     tier: 'platinum' },
  { handle: 'RoamSultan',   tier: 'platinum' },
  { handle: 'DataDruid',    tier: 'gold' },
  { handle: 'Signalist',    tier: 'gold' },
  { handle: 'ByteBaron',    tier: 'gold' },
  { handle: 'GlobetrotterX',tier: 'silver' },
  { handle: 'SIMwhisperer', tier: 'silver' },
  { handle: 'NomadLord',    tier: 'silver' },
  { handle: 'ConnectedCat', tier: 'silver' },
  { handle: 'RoamerPrime',  tier: 'silver' },
  { handle: 'PacketNinja',  tier: 'bronze' },
  { handle: 'TetheredTux',  tier: 'bronze' },
  { handle: 'SIMpatico',    tier: 'bronze' },
  { handle: 'LatencyLord',  tier: 'bronze' },
  { handle: 'MegabitMogul', tier: 'bronze' },
  { handle: 'PortableGuru', tier: 'bronze' },
  { handle: 'GigaNomad',    tier: 'bronze' },
  { handle: 'eSIMCurious',  tier: 'bronze' },
  { handle: 'TravelTick',   tier: 'bronze' },
  { handle: 'RoamReady',    tier: 'bronze' },
  { handle: 'DigitalDrifter', tier: 'bronze' },
  { handle: 'FrequentFlier', tier: 'bronze' },
  { handle: 'WanderWatt',   tier: 'bronze' },
  { handle: 'BitByBit',     tier: 'bronze' },
  { handle: 'JustStartedOut', tier: 'bronze' },
];

async function main() {
  for (let i = 0; i < handles.length; i++) {
    const h = handles[i];
    // Earnings decay logarithmically by rank. Top ~ $8,400, bottom ~ $12.
    const alltime = Math.round(Math.max(1200, 840000 * Math.pow(0.82, i)));
    const month = Math.round(alltime * 0.18);
    const week = Math.round(alltime * 0.045);
    await prisma.affiliateLeaderboardMock.upsert({
      where: { handle: h.handle },
      update: { tier: h.tier, earningsAllTime: BigInt(alltime), earningsMonth: BigInt(month), earningsWeek: BigInt(week) },
      create: { handle: h.handle, tier: h.tier, earningsAllTime: BigInt(alltime), earningsMonth: BigInt(month), earningsWeek: BigInt(week) },
    });
  }
  console.log(`Seeded ${handles.length} leaderboard mock rows`);
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the seed**

Run: `cd backend && npx tsx scripts/seed-leaderboard-mock.ts`
Expected: log "Seeded 25 leaderboard mock rows". Verify with `npx prisma studio` that `AffiliateLeaderboardMock` has 25 rows.

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/seed-leaderboard-mock.ts
git commit -m "feat(affiliate): seed 25 mock leaderboard rows"
```

---

## Task 11: Frontend — tier badges util + API client methods

**Files:**
- Create: `esim-connect-hub/src/pages/affiliate/tierBadges.ts`
- Modify: `esim-connect-hub/src/lib/api.ts`

- [ ] **Step 1: Create tier-badge helper**

```ts
// esim-connect-hub/src/pages/affiliate/tierBadges.ts
export type TierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

export const TIER_META: Record<TierKey, { label: string; color: string; bg: string }> = {
  bronze:   { label: 'Bronze',   color: 'text-amber-700',  bg: 'bg-amber-100' },
  silver:   { label: 'Silver',   color: 'text-slate-700',  bg: 'bg-slate-200' },
  gold:     { label: 'Gold',     color: 'text-yellow-800', bg: 'bg-yellow-100' },
  platinum: { label: 'Platinum', color: 'text-indigo-800', bg: 'bg-indigo-100' },
};

export function avatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`;
}
```

- [ ] **Step 2: Add API client methods**

In `esim-connect-hub/src/lib/api.ts`, add (after existing affiliate methods):

```ts
async getAffiliateLeaderboard(range: 'all' | 'month' | 'week' = 'all') {
  const res = await this.get(`/api/affiliates/leaderboard?range=${range}`);
  return res.data;
}

async getAffiliateGamification() {
  const res = await this.get('/api/affiliates/me/gamification');
  return res.data;
}

async updateAffiliateHandle(handle: string) {
  const res = await this.patch('/api/affiliates/me/handle', { handle });
  return res.data;
}
```

(Adjust to the existing `apiClient` pattern — if it uses `fetch` helpers differently, follow that style.)

- [ ] **Step 3: Commit**

```bash
git add esim-connect-hub/src/pages/affiliate/tierBadges.ts esim-connect-hub/src/lib/api.ts
git commit -m "feat(affiliate): frontend tier-badge util + API client methods"
```

---

## Task 12: Frontend — Hero strip

**Files:**
- Create: `esim-connect-hub/src/pages/affiliate/HeroStrip.tsx`

- [ ] **Step 1: Implement the hero**

```tsx
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiClient } from '@/lib/api';
import { TIER_META, TierKey } from './tierBadges';

export function HeroStrip() {
  const { data } = useQuery({
    queryKey: ['affiliate-gamification'],
    queryFn: () => apiClient.getAffiliateGamification(),
    refetchInterval: 60_000,
  });

  if (!data) return null;

  const tier: TierKey = data.tier.current;
  const meta = TIER_META[tier];
  const progressPct = data.tier.nextThreshold
    ? Math.min(100, (data.tier.activeReferrals / data.tier.nextThreshold) * 100)
    : 100;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
        <div className="text-sm opacity-90">Affiliate Program</div>
        <div className="text-xl font-bold">Earn 40% of every referred merchant's subscription — for life.</div>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge className={`${meta.bg} ${meta.color}`}>{meta.label}</Badge>
              <div className="text-xs text-muted-foreground mt-1">
                {data.tier.next
                  ? `${data.tier.nextThreshold - data.tier.activeReferrals} more active referrals to ${TIER_META[data.tier.next as TierKey].label}`
                  : 'Top tier reached'}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {data.tier.activeReferrals} / {data.tier.nextThreshold ?? '∞'}
            </div>
          </div>
          <Progress value={progressPct} className="mt-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">Recurring (est. / 30 days)</div>
          <div className="text-2xl font-bold">${data.recurring.monthlyEstimate.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">{data.recurring.activeRecurring} active subs</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">Active referrals</div>
          <div className="text-2xl font-bold">{data.tier.activeReferrals}</div>
        </CardContent></Card>
        <Card><CardContent className="pt-4">
          <div className="text-xs text-muted-foreground">This month's challenge</div>
          <div className="text-2xl font-bold">{data.monthly.progress} / {data.monthly.target}</div>
          <div className="text-xs text-muted-foreground">${data.monthly.reward} reward</div>
        </CardContent></Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add esim-connect-hub/src/pages/affiliate/HeroStrip.tsx
git commit -m "feat(affiliate): hero strip with tier, recurring, monthly challenge"
```

---

## Task 13: Frontend — Leaderboard tab

**Files:**
- Create: `esim-connect-hub/src/pages/affiliate/LeaderboardTab.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api';
import { TIER_META, TierKey, avatarUrl } from './tierBadges';

export function LeaderboardTab() {
  const [range, setRange] = useState<'all' | 'month' | 'week'>('all');

  const { data } = useQuery({
    queryKey: ['affiliate-leaderboard', range],
    queryFn: () => apiClient.getAffiliateLeaderboard(range),
    refetchInterval: 60_000,
  });

  const rows = data?.top ?? [];

  return (
    <Tabs value={range} onValueChange={(v) => setRange(v as any)}>
      <TabsList>
        <TabsTrigger value="all">All-Time</TabsTrigger>
        <TabsTrigger value="month">This Month</TabsTrigger>
        <TabsTrigger value="week">This Week</TabsTrigger>
      </TabsList>
      <TabsContent value={range}>
        <Card>
          <CardContent className="pt-4 space-y-2">
            {rows.map((r: any) => (
              <Row key={`${r.rank}-${r.handle}`} row={r} />
            ))}
            {data?.me && !rows.find((r: any) => r.isMe) && (
              <>
                <div className="border-t my-2" />
                <Row row={data.me} />
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function Row({ row }: { row: any }) {
  const meta = TIER_META[row.tier as TierKey] ?? TIER_META.bronze;
  return (
    <div className={`flex items-center gap-3 p-2 rounded ${row.isMe ? 'bg-indigo-50' : ''}`}>
      <div className="w-8 text-right font-semibold text-muted-foreground">#{row.rank}</div>
      <img src={avatarUrl(row.avatarSeed)} alt="" className="w-8 h-8 rounded-full" />
      <div className="flex-1">
        <div className="font-medium">{row.handle}{row.isMe && <span className="text-xs text-indigo-600 ml-2">(you)</span>}</div>
        <Badge className={`${meta.bg} ${meta.color} text-[10px]`}>{meta.label}</Badge>
      </div>
      <div className="font-bold">${row.earnings.toFixed(2)}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add esim-connect-hub/src/pages/affiliate/LeaderboardTab.tsx
git commit -m "feat(affiliate): leaderboard tab with all-time/month/week ranges"
```

---

## Task 14: Frontend — Bounties & Goals tab

**Files:**
- Create: `esim-connect-hub/src/pages/affiliate/BountiesGoalsTab.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle } from 'lucide-react';
import { apiClient } from '@/lib/api';

export function BountiesGoalsTab() {
  const { data } = useQuery({
    queryKey: ['affiliate-gamification'],
    queryFn: () => apiClient.getAffiliateGamification(),
    refetchInterval: 60_000,
  });

  if (!data) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Weekly goals — {data.weekly.isoWeek}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {data.weekly.referralCount} referral{data.weekly.referralCount === 1 ? '' : 's'} this week. Resets {new Date(data.weekly.resetsAt).toLocaleString()}.
          </div>
          {data.weekly.tiers.map((t: any) => {
            const pct = Math.min(100, (data.weekly.referralCount / t.target) * 100);
            return (
              <div key={t.key}>
                <div className="flex justify-between text-sm">
                  <span>{t.key.toUpperCase()} · {t.target} referrals → ${t.reward}</span>
                  <span className={t.paid ? 'text-green-600 font-semibold' : 'text-muted-foreground'}>{t.paid ? 'Paid' : `${data.weekly.referralCount}/${t.target}`}</span>
                </div>
                <Progress value={pct} className="mt-1" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Monthly challenge — {data.monthly.month}</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm mb-2">
            Refer {data.monthly.target} merchants this month → <span className="font-bold">${data.monthly.reward}</span>
          </div>
          <Progress value={Math.min(100, (data.monthly.progress / data.monthly.target) * 100)} />
          <div className="text-xs text-muted-foreground mt-1">
            {data.monthly.progress} / {data.monthly.target}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Milestone bounties</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.milestones.map((m: any) => (
            <div key={m.key} className="flex items-center gap-3">
              {m.claimedAt ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
              <div className="flex-1">
                <div className="font-medium">{m.threshold} active referral{m.threshold > 1 ? 's' : ''}</div>
                <div className="text-xs text-muted-foreground">
                  {m.claimedAt ? `Claimed ${new Date(m.claimedAt).toLocaleDateString()}` : `${Math.max(0, m.threshold - m.progress)} to go`}
                </div>
              </div>
              <div className="font-bold">${m.reward}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add esim-connect-hub/src/pages/affiliate/BountiesGoalsTab.tsx
git commit -m "feat(affiliate): bounties & goals tab with weekly/monthly/milestone cards"
```

---

## Task 15: Frontend — Handle editor

**Files:**
- Create: `esim-connect-hub/src/pages/affiliate/HandleEditor.tsx`

- [ ] **Step 1: Implement**

```tsx
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const HANDLE_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function HandleEditor({ initialHandle }: { initialHandle: string | null }) {
  const [handle, setHandle] = useState(initialHandle ?? '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => { setHandle(initialHandle ?? ''); }, [initialHandle]);

  const valid = HANDLE_REGEX.test(handle);

  const save = async () => {
    if (!valid) return;
    setSaving(true);
    try {
      await apiClient.updateAffiliateHandle(handle);
      toast({ title: 'Handle saved', description: `Your public handle is now ${handle}` });
      qc.invalidateQueries({ queryKey: ['affiliate-gamification'] });
      qc.invalidateQueries({ queryKey: ['affiliate-leaderboard'] });
    } catch (e: any) {
      const msg = e?.response?.data?.errorMessage || e?.message || 'Failed to save handle';
      toast({ title: 'Could not save handle', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Label>Public handle (shown on the leaderboard)</Label>
        <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="ezza_w" />
        {!valid && handle.length > 0 && (
          <div className="text-xs text-red-600 mt-1">3–20 characters, letters/numbers/underscore only.</div>
        )}
      </div>
      <Button onClick={save} disabled={!valid || saving || handle === initialHandle}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add esim-connect-hub/src/pages/affiliate/HandleEditor.tsx
git commit -m "feat(affiliate): public handle editor"
```

---

## Task 16: Wire everything into AffiliateDashboard

**Files:**
- Modify: `esim-connect-hub/src/pages/AffiliateDashboard.tsx`

- [ ] **Step 1: Restructure the page**

Replace the body of `AffiliateDashboard.tsx` (keeping the existing `loadAffiliateData` for codes + commissions history, since those stay on the Overview tab) with:

```tsx
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { HeroStrip } from './affiliate/HeroStrip';
import { LeaderboardTab } from './affiliate/LeaderboardTab';
import { BountiesGoalsTab } from './affiliate/BountiesGoalsTab';
import { HandleEditor } from './affiliate/HandleEditor';
// ... existing imports for overview table

export default function AffiliateDashboard() {
  const { data: gam } = useQuery({
    queryKey: ['affiliate-gamification'],
    queryFn: () => apiClient.getAffiliateGamification(),
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <HeroStrip />
      <HandleEditor initialHandle={gam?.handle ?? null} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="bounties">Bounties & Goals</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          {/* keep the existing codes + commissions history UI here, with a new type filter chip row */}
          <OverviewTab />
        </TabsContent>
        <TabsContent value="leaderboard"><LeaderboardTab /></TabsContent>
        <TabsContent value="bounties"><BountiesGoalsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab() {
  // Move the existing affiliate-code/referral-code/stats/commissions UI into here.
  // Add a type filter above the commissions table:
  //   const [typeFilter, setTypeFilter] = useState<'all' | 'order' | 'subscription' | 'bounty' | 'weekly_goal'>('all');
  //   const filtered = commissions.filter(c => typeFilter === 'all' || c.type === typeFilter);
  // Render chip buttons that set typeFilter; render `filtered` in the existing table;
  // add a `Type` column whose value is c.type formatted as a Badge.
  return <div>{/* migrated existing UI */}</div>;
}
```

Migrate the existing affiliate code / referral code / stats / commissions block into `OverviewTab`. Preserve all existing logic (including payout request button). Add a type filter chip row above the commissions table and a `Type` column to the table showing `c.type`. Do not delete existing functionality.

- [ ] **Step 2: Manually verify**

Run frontend: `cd esim-connect-hub && npm run dev`
Navigate to `/affiliate-dashboard` (or wherever it's routed). Confirm:
- Hero shows tier + recurring + monthly challenge
- Overview tab shows existing codes + commissions, with type chips working
- Leaderboard tab shows top 10 mock rows (your earnings = $0 until you actually refer someone)
- Bounties & Goals tab shows weekly/monthly/milestones
- Handle editor saves and validates

- [ ] **Step 3: Lint**

Run: `cd esim-connect-hub && npm run lint`
Expected: no new warnings.

- [ ] **Step 4: Commit**

```bash
git add esim-connect-hub/src/pages/AffiliateDashboard.tsx
git commit -m "feat(affiliate): restructure dashboard into hero + tabs"
```

---

## Task 17: End-to-end smoke test

- [ ] **Step 1: Run all backend tests**

Run: `cd backend && npx vitest run`
Expected: all green.

- [ ] **Step 2: Run frontend build**

Run: `cd esim-connect-hub && npm run build`
Expected: build succeeds.

- [ ] **Step 3: Manual referral flow test** (requires Stripe CLI or test invoice)

1. As merchant A, copy the referral code from `/affiliate-dashboard`.
2. Sign up merchant B with that code.
3. Subscribe B to a test plan (Starter monthly).
4. Trigger `invoice.paid` webhook (Stripe CLI: `stripe trigger invoice.paid`) or use a real test-mode checkout.
5. Verify on A's dashboard:
   - A new `subscription` commission row appears (40% of B's plan, status `pending`)
   - Active referrals = 1
   - Milestone "1st referral" is claimed with a $25 `bounty` commission (status `paid`)
   - Weekly Bronze goal is marked `paid` with $20 commission
6. Trigger a refund: `stripe trigger charge.refunded`.
7. Verify:
   - Subscription commission status flips to `cancelled`
   - Milestone claim is removed; $25 bounty flips to `cancelled`
   - Weekly Bronze goal flips back to unpaid; $20 commission flips to `cancelled`
   - Tier recomputes to `bronze`

- [ ] **Step 4: Log issues into ISSUES.md** for anything not working as expected

- [ ] **Step 5: Final commit** (if any fixes were needed)

```bash
git add -A
git commit -m "test(affiliate): end-to-end verification + fixes"
```

---

## Out of scope (per spec)

- Admin UI to edit bounty/goal/tier values
- Real-time websocket updates
- Multi-level commissions
- Automatic payout processing

## Done when

- All 17 tasks ticked
- Backend tests pass
- Frontend builds clean
- Manual referral flow verified end-to-end
- `CLAUDE.md` `ISSUES.md` updated with any discovered issues
