import { ConvexHttpClient } from "convex/browser";
import { requiredEnv } from "./env";

export function getConvexClient() {
  return new ConvexHttpClient(requiredEnv("NEXT_PUBLIC_CONVEX_URL"));
}

export function getOptionalConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  return convexUrl ? new ConvexHttpClient(convexUrl) : null;
}

export function getServerSecret() {
  return requiredEnv("MNWHL_SERVER_SECRET");
}
