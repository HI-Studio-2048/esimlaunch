export interface Plan {
  id: 'starter' | 'growth' | 'scale' | 'test';
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  recommended?: boolean;
  /** When true, plan is hidden from public UI (Pricing, Onboarding) but still usable via URL for devs */
  hiddenFromPublic?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'test',
    name: 'Test',
    monthlyPrice: 1,
    yearlyPrice: 10,
    features: ['24h Support Response Time', 'Full White-Labeling'],
    hiddenFromPublic: true,
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 288,
    features: ['24h Support Response Time', 'Full White-Labeling'],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 79,
    yearlyPrice: 786,
    features: ['12h Support Response Time', 'Custom Domain', 'Full White-Labeling', 'Priority Email & Chat Support'],
    recommended: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    features: ['4h Support Response Time', 'Custom Domain', 'Full White-Labeling', 'Priority Email & Chat Support', 'Mobile App'],
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find(p => p.id === id);
}
