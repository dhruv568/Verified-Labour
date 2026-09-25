import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { LocationProvider } from '@/context/LocationContext';
import { ContentProvider } from '@/context/ContentContext';

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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1563959171674938');
fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1563959171674938&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-brand-100 selection:text-brand-900">
        <ContentProvider>
          <LocationProvider>
            {children}
          </LocationProvider>
        </ContentProvider>
      </body>
    </html>
  );
}
