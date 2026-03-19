import type { TemplateKey } from '@/hooks/usePublicStore';
import { LayoutTemplate, Moon, Smartphone, Apple } from 'lucide-react';

export interface StoreTemplateOption {
  key: TemplateKey;
  name: string;
  tagline: string;
  description: string;
  icon: typeof LayoutTemplate;
  previewUrl?: string;
  previewStyle: {
    bg: string;
    accent: string;
    text: string;
    card: string;
  };
}

export const STORE_TEMPLATES: StoreTemplateOption[] = [
  {
    key: 'default',
    name: 'Classic',
    tagline: 'Clean & Professional',
    description: 'Original eSIMLaunch template. Purple gradient hero, violet accents, clean card layout. Great default for most stores.',
    icon: LayoutTemplate,
    previewUrl: 'https://esimlaunch-classic.vercel.app',
    previewStyle: {
      bg: '#f8fafc',
      accent: '#6366f1',
      text: '#1e293b',
      card: '#ffffff',
    },
  },
  {
    key: 'minimal',
    name: 'Revolut',
    tagline: 'Fintech Minimal',
    description: 'Inspired by Revolut and Wise. White background, teal accents, Inter font. Clean utility-class design system.',
    icon: Smartphone,
    previewUrl: 'https://esimlaunch-revolut.vercel.app',
    previewStyle: {
      bg: '#ffffff',
      accent: '#00c9a7',
      text: '#0a0e1a',
      card: '#f7f8fc',
    },
  },
  {
    key: 'bold',
    name: 'Midnight',
    tagline: 'Dark Premium',
    description: 'Full dark mode with electric blue and teal glow. Mobile bottom nav, glassmorphism cards, animated glow effects.',
    icon: Moon,
    previewUrl: 'https://esimlaunch-midnight.vercel.app',
    previewStyle: {
      bg: '#080b18',
      accent: '#4f7eff',
      text: '#f0f2ff',
      card: '#0f1224',
    },
  },
  {
    key: 'travel',
    name: 'Apple',
    tagline: 'Editorial Premium',
    description: 'Apple Store aesthetic. Warm gray canvas, near-black CTAs, Geist font. Oversized typography, full-width section strips.',
    icon: Apple,
    previewUrl: 'https://esimlaunch-apple.vercel.app',
    previewStyle: {
      bg: '#f5f5f7',
      accent: '#1d1d1f',
      text: '#1d1d1f',
      card: '#ffffff',
    },
  },
];

export const TEMPLATE_KEYS: TemplateKey[] = ['default', 'minimal', 'bold', 'travel'];

export interface ColorPreset {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Indigo',    primary: '#6366f1', secondary: '#8b5cf6', accent: '#22c55e' },
  { name: 'Ocean',     primary: '#0ea5e9', secondary: '#38bdf8', accent: '#14b8a6' },
  { name: 'Emerald',   primary: '#10b981', secondary: '#34d399', accent: '#f59e0b' },
  { name: 'Rose',      primary: '#f43f5e', secondary: '#fb7185', accent: '#8b5cf6' },
  { name: 'Amber',     primary: '#f59e0b', secondary: '#fbbf24', accent: '#ef4444' },
  { name: 'Slate',     primary: '#475569', secondary: '#64748b', accent: '#3b82f6' },
  { name: 'Teal',      primary: '#14b8a6', secondary: '#2dd4bf', accent: '#6366f1' },
  { name: 'Fuchsia',   primary: '#d946ef', secondary: '#e879f9', accent: '#06b6d4' },
];

export const SCHEDULE_CALL_URL = 'https://calendly.com/esimlaunch/custom-design';
