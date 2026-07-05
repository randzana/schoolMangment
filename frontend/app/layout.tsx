import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { QueryProvider } from '@/lib/queryClient';
import { Toaster } from 'sonner';

const araknFont = localFont({
  src: './fonts/arakn.ttf',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'School Administration & Financial Management System',
  description: 'Modern web app for school records, tuition, food payments, expenses, salaries, and financial reports.',
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ku" dir="rtl" className={`${araknFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-text">
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
