import type { TemplateKey } from '@/hooks/usePublicStore';
import { LayoutTemplate, Sparkles, Plane, Zap } from 'lucide-react';

export interface StoreTemplateOption {
  key: TemplateKey;
  name: string;
  description: string;
  icon: typeof LayoutTemplate;
  preview?: string; // optional thumbnail URL later
}

export const STORE_TEMPLATES: StoreTemplateOption[] = [
  {
    key: 'default',
    name: 'Classic',
    description: 'Gradient hero, destination cards, and clear CTAs. Great for most stores.',
    icon: LayoutTemplate,
  },
  {
    key: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple. Less visual noise, focus on plans and pricing.',
    icon: Sparkles,
  },
  {
    key: 'bold',
    name: 'Bold',
    description: 'Strong headlines and big imagery. Best for standing out.',
    icon: Zap,
  },
  {
    key: 'travel',
    name: 'Travel',
    description: 'Travel-focused layout with destination-first browsing.',
    icon: Plane,
  },
];

export const TEMPLATE_KEYS: TemplateKey[] = ['default', 'minimal', 'bold', 'travel'];

export const SCHEDULE_CALL_URL = 'https://calendly.com/esimlaunch/custom-design'; // replace with your Calendly or contact link
