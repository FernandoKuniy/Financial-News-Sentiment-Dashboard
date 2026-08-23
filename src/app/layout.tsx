import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";

import { BrandMark } from "@/components/BrandMark";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const description =
  "FinBERT scores the recent headlines on any ticker positive, neutral or negative, " +
  "next to the closing price for the same days.";

// Social cards need absolute URLs, so Next needs a base to resolve them against. Vercel sets
// VERCEL_URL on every deployment, which covers previews without anyone hardcoding a domain.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// opengraph-image.tsx fills in the image tags for both cards on its own, so there is no image
// to name here.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Financial News Sentiment",
  description,
  authors: [{ name: "Fernando Kuniy" }],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Financial News Sentiment",
    title: "Financial News Sentiment",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Financial News Sentiment",
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex w-full max-w-4xl items-center px-6 py-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-semibold tracking-tight whitespace-nowrap"
            >
              {/* The initials are dropped at this size: at 26px each letter lands on a couple
                  of pixels. The text beside the mark says the name anyway. */}
              <BrandMark />
              Financial News Sentiment
            </Link>
          </div>
        </header>
        {children}
        <footer className="border-t border-zinc-100 px-6 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Headlines from NewsAPI, prices from Alpha Vantage, sentiment from FinBERT. It tells you
          how the news read, not where the price is going.
        </footer>
      </body>
    </html>
  );
}
