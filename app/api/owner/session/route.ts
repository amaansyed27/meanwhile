import { NextResponse } from "next/server";
import {
  isOwnerSession,
  refreshOwnerSessionResponse
} from "@/lib/server/owner-session";

export async function GET() {
  if (await isOwnerSession()) {
    return refreshOwnerSessionResponse();
  }

  return NextResponse.json({ isOwner: false });
}
