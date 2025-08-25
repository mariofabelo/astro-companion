import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Astro Research Companion - Revolutionary AI Research Assistant",
  description: "Experience the future of academic research with our revolutionary AI-powered research companion. Discover, analyze, and synthesize knowledge like never before.",
  keywords: ["AI research", "academic papers", "knowledge discovery", "research assistant", "machine learning"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sf antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
