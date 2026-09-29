import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EIRA — Understand what changed',
  description: 'A calmer way to understand the world.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" style={{ colorScheme: 'light' }}>
      <body>{children}</body>
    </html>
  );
}