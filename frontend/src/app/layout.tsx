import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PeakPack — Push each other to your best version",
    template: "%s | PeakPack",
  },
  description:
    "Community-driven fitness & nutrition accountability. Set goals, join a Pack, build streaks, earn XP, and compete on leaderboards.",
  keywords: [
    "fitness",
    "accountability",
    "workout tracker",
    "nutrition",
    "streak",
    "gamification",
    "community",
  ],
  authors: [{ name: "PeakPack" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "PeakPack",
    title: "PeakPack — Push each other to your best version",
    description:
      "Community-driven fitness & nutrition accountability. Set goals, join a Pack, build streaks, earn XP, and compete on leaderboards.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
