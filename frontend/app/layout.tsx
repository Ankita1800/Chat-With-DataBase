import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chat with Database - AI-Powered Data Insights",
  description: "Upload your CSV data and chat with it using AI. Get instant insights, run queries, and explore your data naturally.",
  keywords: ["database", "AI", "chat", "CSV", "data analysis", "SQL"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased gradient-bg`}
      >
        {children}
      </body>
    </html>
  );
}
