import Link from 'next/link';

const POPULAR_SLUGS: { name: string; slug: string }[] = [
  { name: 'Japan', slug: 'japan-esim' },
  { name: 'France', slug: 'france-esim' },
  { name: 'Thailand', slug: 'thailand-esim' },
  { name: 'United Kingdom', slug: 'united-kingdom-esim' },
  { name: 'Spain', slug: 'spain-esim' },
  { name: 'United States', slug: 'united-states-esim' },
  { name: 'Australia', slug: 'australia-esim' },
  { name: 'Italy', slug: 'italy-esim' },
  { name: 'Germany', slug: 'germany-esim' },
  { name: 'Singapore', slug: 'singapore-esim' },
  { name: 'South Korea', slug: 'south-korea-esim' },
  { name: 'Mexico', slug: 'mexico-esim' },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
        {/* Top: logo + tagline + utility links */}
        <div className="flex flex-col gap-8 border-b border-slate-200 pb-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-white">
                📶
              </span>
              <span className="text-xl font-bold text-slate-900">eSIM Store</span>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Stay connected on your adventures without hefty roaming fees. eSIMs for 190+ countries worldwide.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="#" className="text-slate-600 hover:text-slate-900">Terms of Service</Link>
            <Link href="#" className="text-slate-600 hover:text-slate-900">Privacy Policy</Link>
            <Link href="#" className="text-slate-600 hover:text-slate-900">Contact Us</Link>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="text-slate-400">🌐</span> English
            </span>
          </div>
        </div>

        {/* Middle: Popular Destinations + Learn More */}
        <div className="grid gap-8 border-b border-slate-200 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-semibold text-slate-900">Popular Destinations</h3>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
              {POPULAR_SLUGS.map(({ name, slug }) => (
                <Link
                  key={slug}
                  href={`/countries/${slug}`}
                  className="hover:text-slate-900"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Learn More</h3>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Destinations</Link>
              <Link href="/my-esims" className="hover:text-slate-900">My eSIMs</Link>
              <Link href="#" className="hover:text-slate-900">About eSIM</Link>
            </div>
          </div>
        </div>

        {/* Bottom: copyright + payment icons */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} eSIM Store. All rights reserved. Powered by esimlaunch
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-xs font-medium">We accept</span>
            <div className="flex gap-2">
              <span className="flex h-8 w-12 items-center justify-center rounded border border-slate-200 bg-white text-xs font-bold text-slate-500">VISA</span>
              <span className="flex h-8 w-12 items-center justify-center rounded border border-slate-200 bg-white text-xs font-bold text-slate-500">MC</span>
              <span className="flex h-8 w-12 items-center justify-center rounded border border-slate-200 bg-white text-xs font-bold text-slate-500">AMEX</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
