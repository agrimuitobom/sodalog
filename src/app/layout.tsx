import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import InstallBanner from "@/components/InstallBanner";

export const metadata: Metadata = {
  title: "そだログ - 栽培記録アプリ",
  description: "農業高校生向けの栽培記録アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "そだログ",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className="bg-gray-50 antialiased">
        <AuthProvider>
          <ToastProvider>
            <ErrorBoundary>
              <main className="max-w-lg mx-auto min-h-screen pb-16">{children}</main>
              <footer className="max-w-lg mx-auto text-center text-xs text-gray-400 py-4">
                &copy; {new Date().getFullYear()} そだログ
              </footer>
            </ErrorBoundary>
            <InstallBanner />
            <ServiceWorkerRegistration />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
