import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { StoreConfigProvider } from '@/contexts/StoreConfigContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';

const fontDmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'eSIM Connect',
  description: 'Stay connected wherever life takes you.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={fontDmSans.variable}>
        <body className="font-sans">
          <StoreConfigProvider>
            <CurrencyProvider>
              <Navbar />
              <main className="min-h-screen">
                {children}
              </main>
              <Footer />
              <Toaster />
            </CurrencyProvider>
          </StoreConfigProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
