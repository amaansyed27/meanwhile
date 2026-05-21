"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function AppProviders({ children }: { children: ReactNode }) {
  if (!convex) {
    return <ThemeProvider attribute="class">{children}</ThemeProvider>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    </ThemeProvider>
  );
}
