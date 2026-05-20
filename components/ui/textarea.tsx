"use client";

import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-28 w-full resize-none border border-border bg-transparent px-3 py-3 text-sm leading-6 text-foreground placeholder:text-faint transition",
      "focus:border-foreground focus:outline-none",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
