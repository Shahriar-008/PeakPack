import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";
import "./globals.css";
import { QueryProvider, AuthProvider } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
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
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${inter.variable} ${lexend.variable} font-sans antialiased min-h-screen bg-[#0A0A0A] text-on-surface selection:bg-primary-container selection:text-black overflow-x-hidden`}
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
