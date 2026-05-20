"use client";

import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

export function useRegisterViewer() {
  const { isAuthenticated } = useConvexAuth();
  const upsert = useMutation(api.viewer.upsertCurrentUser);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void upsert().catch(() => undefined);
  }, [isAuthenticated, upsert]);
}
