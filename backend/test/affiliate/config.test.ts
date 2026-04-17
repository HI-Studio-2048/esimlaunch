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
