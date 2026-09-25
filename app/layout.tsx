import './globals.css';
import type { Metadata } from 'next';
import { ZevaChat } from '@/components/zeva-chat';

export const metadata: Metadata = {
  title: 'ANNORA — Turning Surplus into Support',
  description:
    'ANNORA helps surplus food reach verified organizations that need it while coordinating the people and logistics required to make that happen.',
  metadataBase: new URL('https://annora-demo.local'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
        <ZevaChat />
        <p className="site-credit">Developed by Hacksmiths</p>
      </body>
    </html>
  );
}
