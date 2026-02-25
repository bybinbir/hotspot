import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hotspot Yönetim Paneli',
  description: 'Multi-tenant hotspot yönetim sistemi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
