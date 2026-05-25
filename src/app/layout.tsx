import type { Metadata } from "next";
import { League_Spartan } from "next/font/google";
import "./globals.css";

const league = League_Spartan({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-league",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyCult — Operator",
  description: "Configure and monitor your loyalty program",
  icons: {
    icon: "/brand/MyCult.png",
    apple: "/brand/MyCult.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${league.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full bg-[var(--background)] font-sans text-[var(--color-forest)]">
        {children}
      </body>
    </html>
  );
}
