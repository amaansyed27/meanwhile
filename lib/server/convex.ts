import { ConvexHttpClient } from "convex/browser";
import { requiredEnv } from "./env";

export function getConvexClient() {
  return new ConvexHttpClient(requiredEnv("NEXT_PUBLIC_CONVEX_URL"));
}

export function getServerSecret() {
  return requiredEnv("MNWHL_SERVER_SECRET");
}
