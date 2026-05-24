import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import { MissingConfig } from "@/components/app/missing-config";
import { getAppUrl, getSiteDescription, isOwnerSurface } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

const appUrl = getAppUrl();
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const appDescription = getSiteDescription();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "mnwhl",
    template: "%s / mnwhl"
  },
  description: appDescription,
  applicationName: "mnwhl",
  openGraph: {
    title: "mnwhl",
    description: appDescription,
    url: appUrl,
    siteName: "mnwhl",
    images: ["/opengraph-image.png"],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "mnwhl",
    description: appDescription,
    images: ["/opengraph-image.png"]
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png"
  },
  robots: isOwnerSurface()
    ? {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false
        }
      }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1
        }
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
  const missing = !convexUrl;

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
