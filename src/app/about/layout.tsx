import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | My Next Ride Ontario',
  description: 'Learn how My Next Ride Ontario helps every credit profile find the right vehicle with a 17-lender network and a 24-hour response promise.',
  alternates: { canonical: '/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}

