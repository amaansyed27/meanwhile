"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "solid" | "ghost" | "outline" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  solid:
    "border-foreground bg-foreground text-background hover:translate-x-0.5 hover:-translate-y-0.5",
  ghost: "border-transparent hover:border-border hover:bg-surface",
  outline:
    "border-border bg-transparent hover:border-foreground hover:translate-x-0.5 hover:-translate-y-0.5",
  danger: "border-danger text-danger hover:bg-danger hover:text-background"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "ghost", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-2 border px-3 text-sm font-medium lowercase transition disabled:pointer-events-none disabled:opacity-45",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
