import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function requireAgentToken(request: NextRequest) {
  const expected = process.env.MNWHL_AGENT_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Agent intake is not configured" },
      { status: 503 }
    );
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (!token || !safeEqual(token, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
