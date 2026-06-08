import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ORŸA Admin',
  description: 'ORŸA - Crypto Wallet & DeFi Super App Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}