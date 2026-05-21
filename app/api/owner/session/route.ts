import { NextResponse } from "next/server";
import { isOwnerSession } from "@/lib/server/owner-session";

export async function GET() {
  return NextResponse.json({ isOwner: await isOwnerSession() });
}
