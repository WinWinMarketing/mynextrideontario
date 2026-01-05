import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply | My Next Ride Ontario Vehicle Financing',
  description: 'Submit your vehicle financing application in minutes. Secure, fast, and reviewed within 24 hours for all credit types.',
  alternates: { canonical: '/apply' },
};

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return children;
}

