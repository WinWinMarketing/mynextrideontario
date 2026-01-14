import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://mynextrideontario.ca'),
  title: {
    default: 'My Next Ride Ontario | Find Your Perfect Vehicle',
    template: '%s | My Next Ride Ontario',
  },
  description: 'Get matched with your perfect vehicle from our network of dealers. We work with 17 lenders for all credit types. Apply today and get a response within 24 hours.',
  keywords: ['car financing Ontario', 'vehicle financing', 'auto loans', 'bad credit car loans', 'used cars Ontario', 'car dealership GTA', 'auto financing Toronto', 'car loans Durham region'],
  authors: [{ name: 'My Next Ride Ontario' }],
  creator: 'My Next Ride Ontario',
  publisher: 'My Next Ride Ontario',
  openGraph: {
    title: 'My Next Ride Ontario | Find Your Perfect Vehicle',
    description: 'Get matched with your perfect vehicle. All credit types welcome. Response within 24 hours.',
    url: '/',
    siteName: 'My Next Ride Ontario',
    type: 'website',
    locale: 'en_CA',
    images: [
      {
        url: '/favicon.svg',
        width: 512,
        height: 512,
        alt: 'My Next Ride Ontario Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Next Ride Ontario | Find Your Perfect Vehicle',
    description: 'Get matched with your perfect vehicle. All credit types welcome.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1948b3',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
