import type { Metadata, Viewport } from 'next';

import './globals.css';

// PROJECT IMPORTS
import ProviderWrapper from './ProviderWrapper';
import { publicSans } from 'config';

export const metadata: Metadata = {
  title: 'TCSS 460 UI Template',
  description: 'TCSS 460 UI Template'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={publicSans.className}>
        <ProviderWrapper>{children}</ProviderWrapper>
      </body>
    </html>
  );
}
