'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getDisplayNameFromCountrySlug } from '@/lib/country-slugs';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

const PATH_LABELS: Record<string, string> = {
  '': 'Home',
  countries: 'Destinations',
  regions: 'Regions',
  checkout: 'Checkout',
  'my-esims': 'My eSIMs',
  account: 'Account',
  orders: 'Orders',
  settings: 'Settings',
  affiliate: 'Affiliate',
  support: 'Support',
  tickets: 'Tickets',
  new: 'New',
  'help-center': 'Help Center',
  'esim-setup-guide': 'eSIM Setup Guide',
  about: 'About',
  terms: 'Terms',
  privacy: 'Privacy',
  refund: 'Refund',
  cookies: 'Cookies',
  contact: 'Contact',
  faq: 'FAQ',
};

/** Override href for path segments that don't have a standalone page */
const PATH_HREF_OVERRIDES: Record<string, string> = {
  countries: '/#destinations',
  regions: '/regions',
};

export function Breadcrumbs({ items: customItems }: BreadcrumbsProps) {
  const pathname = usePathname();

  const items: BreadcrumbItem[] =
    customItems ??
    (() => {
      const segments = pathname.split('/').filter(Boolean);
      const result: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
      let href = '';
      for (let i = 0; i < segments.length; i++) {
        href += `/${segments[i]}`;
        let label = PATH_LABELS[segments[i]] ?? segments[i].replace(/-/g, ' ');
        if (i > 0 && segments[0] === 'countries' && segments[i].endsWith('-esim')) {
          label = getDisplayNameFromCountrySlug(segments[i]);
        }
        const linkHref = PATH_HREF_OVERRIDES[segments[i]] ?? href;
        result.push(
          i === segments.length - 1
            ? { label }
            : { label, href: linkHref },
        );
      }
      return result;
    })();

  if (items.length <= 1) return null; // Home only - no breadcrumbs

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pb-4 pt-2 lg:px-8">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-[#6e6e73]">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-[#adadb8]">/</span>}
            {item.href ? (
              <Link href={item.href} className="text-[#6e6e73] transition-colors hover:text-[#0066cc]">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-[#1d1d1f]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
