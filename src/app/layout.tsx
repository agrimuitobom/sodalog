import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "そだログ - 栽培記録アプリ",
  description: "農業高校生向けの栽培記録アプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 antialiased">
        <AuthProvider>
          <main className="max-w-lg mx-auto min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
