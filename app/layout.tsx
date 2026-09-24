import type { Metadata } from 'next';
import './globals.css';
import { LocationProvider } from '@/context/LocationContext';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Verified Labour — काम चाहिए? कामगार चाहिए? दोनों एक जगह।',
  description:
    'Verified workers on demand. Book skilled and verified workers near you with a simple, trusted on-demand experience.',
  keywords: [
    'labour marketplace',
    'verified workers',
    'plumber near me',
    'electrician near me',
    'construction workers',
    'carpenter',
    'house cleaner',
    'Aadhaar verified labour',
  ],
  authors: [{ name: 'Verified Labour' }],
  openGraph: {
    title: 'Verified Labour — काम चाहिए? कामगार चाहिए? दोनों एक जगह।',
    description: 'Book skilled and verified workers near you with a simple, trusted on-demand experience.',
    type: 'website',
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-brand-100 selection:text-brand-900">
        <LocationProvider>
          {children}
        </LocationProvider>
      </body>
    </html>
  );
}
