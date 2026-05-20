"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full border border-border bg-transparent px-3 text-sm text-foreground placeholder:text-faint transition",
        "focus:border-foreground focus:outline-none",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
