export type HelpCategory = 'Getting Started' | 'Installation' | 'Billing' | 'Troubleshooting';

export interface HelpArticle {
  id: string;
  title: string;
  shortDesc: string;
  category: HelpCategory;
  slug?: string;
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: '1',
    title: 'What is an eSIM?',
    shortDesc: 'Learn how digital SIMs work and why they\'re great for travel.',
    category: 'Getting Started',
    slug: 'what-is-esim',
  },
  {
    id: '2',
    title: 'Is my phone compatible?',
    shortDesc: 'Check if your device supports eSIM before purchasing.',
    category: 'Getting Started',
    slug: 'device-compatibility',
  },
  {
    id: '3',
    title: 'How to install your eSIM',
    shortDesc: 'Step-by-step guide for iPhone and Android.',
    category: 'Installation',
    slug: 'install-ios',
  },
  {
    id: '4',
    title: 'Installing eSIM on iPhone',
    shortDesc: 'Scan QR code or enter activation code on iPhone.',
    category: 'Installation',
    slug: 'install-ios',
  },
  {
    id: '5',
    title: 'Installing eSIM on Android',
    shortDesc: 'Add cellular plan via Settings on Pixel and Samsung.',
    category: 'Installation',
    slug: 'install-android',
  },
  {
    id: '6',
    title: 'When to activate your eSIM',
    shortDesc: 'Install before travel, activate when you arrive.',
    category: 'Installation',
    slug: 'activation-timing',
  },
  {
    id: '7',
    title: 'Payment methods and checkout',
    shortDesc: 'We accept cards and Store Credit.',
    category: 'Billing',
    slug: 'payment-methods',
  },
  {
    id: '8',
    title: 'Download your receipt',
    shortDesc: 'Get a PDF receipt from My eSIMs or Order History.',
    category: 'Billing',
    slug: 'receipt-download',
  },
  {
    id: '9',
    title: 'Top up your plan',
    shortDesc: 'Add more data to eligible plans.',
    category: 'Billing',
    slug: 'top-up',
  },
  {
    id: '10',
    title: 'eSIM not activating',
    shortDesc: 'Troubleshoot activation and connection issues.',
    category: 'Troubleshooting',
    slug: 'activation-issues',
  },
  {
    id: '11',
    title: 'No data connection abroad',
    shortDesc: 'Check APN, roaming settings, and network selection.',
    category: 'Troubleshooting',
    slug: 'no-connection',
  },
  {
    id: '12',
    title: 'Resend my eSIM email',
    shortDesc: 'Request a new email with your QR code.',
    category: 'Troubleshooting',
    slug: 'resend-esim',
  },
];
