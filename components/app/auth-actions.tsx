"use client";

import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";

export function AuthActions() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <span className="font-mono text-xs text-faint">checking session</span>;
  }

  if (isAuthenticated) {
    return <UserButton />;
  }

  return (
    <div className="flex items-center gap-2">
      <SignInButton mode="modal">
        <Button className="h-8">sign in</Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button className="h-8" variant="outline">
          join
        </Button>
      </SignUpButton>
    </div>
  );
}
