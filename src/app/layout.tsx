import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Caveat, Crimson_Text } from "next/font/google";
import "./globals.css";

// Import providers
import { AppProviders } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

const crimsonText = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Text Formatter",
  description: "Transform messy text into organized, readable formats with intelligent pattern recognition",
  keywords: ["text formatting", "pattern recognition", "document organization", "productivity"],
  authors: [{ name: "Text Formatter Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ea580c" },
    { media: "(prefers-color-scheme: dark)", color: "#ea580c" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${caveat.variable} ${crimsonText.variable} font-content antialiased`}
        suppressHydrationWarning
      >
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
