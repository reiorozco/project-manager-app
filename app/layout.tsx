import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/app/auth/auth-context";
import { ThemeProvider } from "@/app/components/theme-provider";
import Navbar from "@/app/components/Navbar";
import QueryClientProvider from "@/app/QueryClientProvider";

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
  metadataBase: new URL("https://project-manager-app-cyan.vercel.app"),
  title: "Project Manager",
  description: "Design project management app with multi-role access",
  openGraph: {
    title: "Project Manager — Multi-Role Project Management",
    description:
      "Full-stack project management app (Next.js, Prisma, Supabase) with role-based access, a project lifecycle and file storage.",
    url: "https://project-manager-app-cyan.vercel.app",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Project Manager — multi-role project management for design teams",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Manager — Multi-Role Project Management",
    description:
      "Multi-role project management for design teams — from draft to sign-off.",
    images: ["/og.png"],
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
        <QueryClientProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="min-h-screen bg-muted/40">
                {/* Top navigation */}
                <Navbar />

                {/* Main content */}
                <main className="py-6 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  {children}
                </main>
              </div>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
