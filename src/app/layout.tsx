import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";

const inter = localFont({
  src: "./fonts/Inter-Variable.ttf",
  variable: "--font-inter",
  display: "swap",
});

const mSaans = localFont({
  src: [
    {
      path: "./fonts/m-saans-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/m-saans-medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/m-saans-semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/m-saans-bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-saans",
  display: "swap",
});

import Script from "next/script";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Entra - Event Ticketing Platform",
  description: "Your modern and reliable event ticketing platform.",
  icons: {
    icon: [
      { url: "/assets/white-logo.png?v=4", type: "image/png" },
    ],
    shortcut: "/assets/white-logo.png?v=4",
    apple: "/assets/white-logo.png?v=4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <body className={`${mSaans.className} ${mSaans.variable} ${inter.variable} min-h-screen bg-background text-foreground antialiased font-saans`}>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
              <Toaster richColors position="top-center" closeButton />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
        <Script 
          src="https://app.sandbox.midtrans.com/snap/snap.js" 
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-dummy-key-for-dev-only"} 
          strategy="afterInteractive" 
        />
      </body>
    </html>
  );
}
