import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | My Next Ride Ontario',
  description: 'Contact My Next Ride Ontario for fast answers about vehicle financing in the GTA. We respond within 24 hours.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

