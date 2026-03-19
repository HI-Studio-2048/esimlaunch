import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';
import { StoreConfigProvider } from '@/contexts/StoreConfigContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'eSIM Hub — Global Data for Smart Travelers',
  description: 'Instant eSIM activation in 190+ countries. No contracts, no roaming fees.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="font-sans">
          <StoreConfigProvider>
            <CurrencyProvider>
              <Navbar />
              <main className="min-h-screen">{children}</main>
              <Footer />
              <Toaster />
            </CurrencyProvider>
          </StoreConfigProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
