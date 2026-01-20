import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProviderWrapper from "./(components)/AuthProviderWrapper";
import { CartProvider } from "./(contexts)/CartContext";
import { ThemeProvider } from "./(contexts)/ThemeContext";
import { Toaster } from "sonner";
import ScrollRestorationFix from "./(components)/ScrollRestore";
import { Analytics } from "@vercel/analytics/react";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dineezy - Restaurant Management Platform | QR Code Ordering & Reservations",
  description: "Dineezy is a comprehensive restaurant management platform offering QR code ordering, table reservations, digital menu management, payment processing, and analytics. Streamline your restaurant operations with contactless dining solutions.",
  keywords: "restaurant management, QR code ordering, table reservations, digital menu, contactless dining, restaurant technology, food ordering system",
  authors: [{ name: "Dineezy Team" }],
  creator: "Dineezy",
  publisher: "Dineezy",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Dineezy - Restaurant Management Platform",
    description: "Transform your restaurant with QR code ordering, reservations, and digital management tools.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Dineezy Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dineezy - Restaurant Management Platform",
    description: "Transform your restaurant with QR code ordering, reservations, and digital management tools.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Toaster />
          <AuthProviderWrapper>
            <CartProvider>
              <ScrollRestorationFix />
              {children}
              <Analytics />
            </CartProvider>
          </AuthProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
