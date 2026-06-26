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
  description: "App de gestión de proyectos de diseño con acceso multi-rol",
  openGraph: {
    title: "Project Manager — Multi-Role Project Management",
    description:
      "App full-stack de gestión de proyectos (Next.js, Prisma, Supabase) con acceso por roles, Row-Level Security y almacenamiento de archivos.",
    url: "https://project-manager-app-cyan.vercel.app",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
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
