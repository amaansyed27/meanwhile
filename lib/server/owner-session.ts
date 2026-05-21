import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requiredEnv } from "./env";

const COOKIE_NAME = "mnwhl_owner";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function sign(value: string) {
  return createHmac("sha256", requiredEnv("MNWHL_SESSION_SECRET"))
    .update(value)
    .digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyPassword(password: string) {
  return safeEqual(password, requiredEnv("MNWHL_OWNER_PASSWORD"));
}

export function createOwnerSessionResponse() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString("hex");
  const payload = `${expiresAt}.${nonce}`;
  const token = `${payload}.${sign(payload)}`;
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000
  });
  return response;
}

export async function isOwnerSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }

  const [expiresAt, nonce, signature] = token.split(".");
  if (!expiresAt || !nonce || !signature) {
    return false;
  }
  if (Number(expiresAt) < Date.now()) {
    return false;
  }

  return safeEqual(sign(`${expiresAt}.${nonce}`), signature);
}

export async function requireOwnerSession() {
  if (!(await isOwnerSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function clearOwnerSessionResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return response;
}
