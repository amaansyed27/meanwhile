"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <Button
      className="h-8 w-8 px-0"
      aria-label="toggle theme"
      onClick={() => setTheme(dark ? "light" : "dark")}
      title="toggle theme"
      suppressHydrationWarning
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </Button>
  );
}
