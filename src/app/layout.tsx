import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import AuthProvider from '@/components/auth/AuthProvider';

export const metadata: Metadata = {
  title: 'COBACAM',
  description: 'COBACAM - Sistema de Gestión de Asistencia',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background font-sans')}>
        <FirebaseClientProvider>
          <SidebarProvider>
            <AuthProvider>
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-4 md:p-8 pt-6">
                  {children}
                </main>
              </div>
              <Toaster />
            </AuthProvider>
          </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
