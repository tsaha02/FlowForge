import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FlowForge — The Open-Source Visual Workflow Engine',
  description:
    'Design, execute, and monitor powerful automated workflows with FlowForge. The professional drag-and-drop DAG orchestrator for modern teams.',
  keywords: ['workflow automation', 'visual editor', 'DAG', 'orchestration', 'open source', 'low-code'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder-client-id'}>
          <GlobalErrorBoundary>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </GlobalErrorBoundary>
          <Toaster richColors position="top-right" />
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
