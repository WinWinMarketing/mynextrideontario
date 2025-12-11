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
  title: 'My Next Ride Ontario | Find Your Perfect Vehicle',
  description: 'Get matched with your perfect vehicle from our network of dealers. We work with 17 lenders for all credit types. Apply today and get a response within 24 hours.',
  keywords: 'car financing Ontario, vehicle financing, auto loans, bad credit car loans, used cars Ontario, car dealership GTA',
  openGraph: {
    title: 'My Next Ride Ontario | Find Your Perfect Vehicle',
    description: 'Get matched with your perfect vehicle. All credit types welcome. Response within 24 hours.',
    type: 'website',
    locale: 'en_CA',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
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
