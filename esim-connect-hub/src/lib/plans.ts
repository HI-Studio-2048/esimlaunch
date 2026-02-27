export interface Plan {
  id: 'starter' | 'growth' | 'scale';
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  recommended?: boolean;
  ordersPerMonth: string;
}

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: ['Up to 100 orders/month', 'Basic analytics', 'Email support'],
    ordersPerMonth: '100',
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: ['Up to 1,000 orders/month', 'Advanced analytics', 'Priority support'],
    recommended: true,
    ordersPerMonth: '1,000',
  },
  {
    id: 'scale',
    name: 'Scale',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: ['Unlimited orders', 'Custom domains', 'Dedicated support'],
    ordersPerMonth: 'Unlimited',
  },
];

export function getPlanById(id: string): Plan | undefined {
  return PLANS.find(p => p.id === id);
}
