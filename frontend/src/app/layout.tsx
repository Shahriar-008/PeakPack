import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { QueryProvider, AuthProvider } from "@/components/providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
