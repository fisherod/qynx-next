// =================================
// 🏗️ Root Layout - Next.js App Router
// =================================

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/providers/I18nProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "QYNX",
  description: "Secure USDT multi-chain payment platform supporting BSC, Ethereum and Tron networks",
  keywords: [
    "cryptocurrency",
    "digital currency payment",
    "USDT",
    "BSC",
    "Ethereum",
    "Tron",
    "blockchain payment",
    "crypto",
    "payment",
  ],
  authors: [{ name: "Crypto Payment Platform" }],

  robots: "index, follow",
  openGraph: {
    title: "Crypto Payment Platform",
    description: "Secure USDT multi-chain payment platform supporting multiple blockchain networks",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Payment Platform",
    description:
      "Secure USDT payment platform supporting multiple blockchain networks",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>

        {/* Favicon and app icons */}
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />

        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />

        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#3B82F6" />
        <meta name="msapplication-TileColor" content="#3B82F6" />

        {/* Prevent theme hydration mismatch */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                const resolvedTheme = theme === 'system' 
                  ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                  : theme;
                document.documentElement.classList.add(resolvedTheme);
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body
        className={`${inter.className} h-full antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider defaultTheme="dark">
          <SessionProvider>
            <I18nProvider>
              <ToastProvider>
                <ErrorBoundary>
                  {/* Global wrapper with dark mode support */}
                  <div className="min-h-full bg-white dark:bg-gray-900 transition-colors duration-200">
                    {children}
                  </div>
                </ErrorBoundary>
              </ToastProvider>
            </I18nProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
