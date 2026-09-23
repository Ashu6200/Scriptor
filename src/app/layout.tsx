import "./globals.css";
import { CommandMenu } from "@/components/CommandMenu";
import { ThemeProvider } from "@/components/ThemeProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import StoreProvider from "./StoreProvider";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Scriptor — Developer-First Technical Documentation & Knowledge Base",
    template: "%s | Scriptor",
  },
  description:
    "The modern engineering documentation workspace. Write system specs with TipTap, organize hierarchical document trees, restore version history snapshots, and maintain immutable audit logs.",
  keywords: [
    "developer documentation",
    "technical specs",
    "markdown knowledge base",
    "hierarchical documents",
    "version snapshots",
    "audit logs",
    "engineering docs",
    "TipTap editor",
  ],
  authors: [{ name: "Scriptor Team" }],
  creator: "Scriptor",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://Scriptor.app",
    title: "Scriptor — Developer-First Technical Documentation & Knowledge Base",
    description:
      "Write system specs with TipTap, organize hierarchical document trees, restore version history snapshots, and maintain immutable audit logs.",
    siteName: "Scriptor",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scriptor — Developer-First Technical Documentation & Knowledge Base",
    description:
      "Modern engineering documentation workspace. Organize nested documents, save snapshots, and maintain immutable audit logs.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            {children}
            <CommandMenu />
          </StoreProvider>
          <Toaster theme="system" position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
