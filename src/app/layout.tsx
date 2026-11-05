import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BOTTxTrace - Bohr Testnet Transaction Tracer',
  description: 'Execution trace and transaction inspector for Botchain Testnet (Chain ID 968)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
