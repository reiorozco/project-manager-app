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
  title: "Project Manager",
  description: "App de gestión de proyectos de diseño",
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
              <div className="min-h-screen bg-gray-50 dark:bg-black">
                {/* Navegación superior */}
                <Navbar />

                {/* Contenido principal */}
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
