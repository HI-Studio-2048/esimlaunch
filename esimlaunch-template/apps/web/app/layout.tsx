import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { StoreConfigProvider } from '@/contexts/StoreConfigContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ErrorToastProvider } from '@/components/ui/error-toast-provider';

const fontJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'eSIM Store',
  description: 'Get connected instantly with affordable eSIMs worldwide.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={fontJakarta.variable}>
        <body className="font-sans">
          <StoreConfigProvider>
            <CurrencyProvider>
              <Navbar />
              <main className="min-h-screen">
                <Breadcrumbs />
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
