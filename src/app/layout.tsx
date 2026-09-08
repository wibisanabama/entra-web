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

import Script from "next/script";

export const metadata: Metadata = {
  title: "Entra - Event Ticketing Platform",
  description: "Your modern and reliable event ticketing platform.",
  icons: {
    icon: [
      { url: "/assets/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/assets/icon.png",
    apple: "/assets/icon.png",
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <body className={`${inter.className} ${inter.variable} min-h-screen bg-background text-foreground antialiased`}>
        <Toaster position="top-center" richColors />
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              {children}
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
