import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'USH Dashboard',
  description: 'Admin analytics dashboard for Telegram Wheel of Fortune bot',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon.png', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
