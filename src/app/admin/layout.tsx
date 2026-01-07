import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | My Next Ride Ontario',
  description: 'Admin dashboard (restricted).',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}




