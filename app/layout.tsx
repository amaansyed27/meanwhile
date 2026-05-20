import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import { MissingConfig } from "@/components/app/missing-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "mnwhl",
    template: "%s / mnwhl"
  },
  description: "a quiet place for ongoing things.",
  applicationName: "mnwhl",
  openGraph: {
    title: "mnwhl",
    description: "a quiet place for ongoing things.",
    url: appUrl,
    siteName: "mnwhl",
    images: ["/opengraph-image.png"],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "mnwhl",
    description: "a quiet place for ongoing things.",
    images: ["/opengraph-image.png"]
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#252421" }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const missing = !clerkKey || !convexUrl;

  if (missing) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <MissingConfig />
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkKey}>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <AppProviders>{children}</AppProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
