import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { StoreConfigProvider } from '@/contexts/StoreConfigContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'eSIM — Seamless Global Connectivity',
  description: 'Experience seamless connectivity. Crafted for the modern traveler.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={GeistSans.variable}>
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
