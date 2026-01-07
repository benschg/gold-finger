import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gold-finger.app";

export const metadata: Metadata = {
  title: {
    default: "Gold Finger - Expense Tracking",
    template: "%s | Gold Finger",
  },
  description:
    "Track and manage your expenses with ease. Simple, beautiful expense tracking for individuals and teams.",
  metadataBase: new URL(baseUrl),
  keywords: [
    "expense tracking",
    "budget",
    "finance",
    "money management",
    "shared expenses",
  ],
  authors: [{ name: "Gold Finger" }],
  creator: "Gold Finger",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "Gold Finger",
    title: "Gold Finger - Expense Tracking",
    description:
      "Track and manage your expenses with ease. Simple, beautiful expense tracking for individuals and teams.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gold Finger - Expense Tracking",
    description:
      "Track and manage your expenses with ease. Simple, beautiful expense tracking for individuals and teams.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
