import { clearOwnerSessionResponse } from "@/lib/server/owner-session";

export async function POST() {
  return clearOwnerSessionResponse();
}
