import { NextRequest, NextResponse } from "next/server";
import { createOwnerSessionResponse, verifyPassword } from "@/lib/server/owner-session";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: string };
    if (!body.password || !verifyPassword(body.password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    return createOwnerSessionResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
