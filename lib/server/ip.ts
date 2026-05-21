import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { requiredEnv } from "./env";

export function getRequestIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwarded || realIp || "local";
}

export function getActorHash(request: NextRequest) {
  const salt = requiredEnv("MNWHL_REACTION_SALT");
  return createHmac("sha256", salt).update(getRequestIp(request)).digest("hex");
}
