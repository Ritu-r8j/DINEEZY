import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProviderWrapper from "./(components)/AuthProviderWrapper";
import { Toaster } from "sonner";


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
  openGraph: {
    title: "Dineezy - Restaurant Management Platform",
    description: "Transform your restaurant with QR code ordering, reservations, and digital management tools.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dineezy - Restaurant Management Platform",
    description: "Transform your restaurant with QR code ordering, reservations, and digital management tools.",
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
      ><>
           <Toaster/>
          <AuthProviderWrapper>
            {children}
          </AuthProviderWrapper>
        </>
      </body>
    </html>
  );
}
