import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getConvexClient, getServerSecret } from "@/lib/server/convex";
import { getActorHash } from "@/lib/server/ip";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      threadId?: Id<"threads">;
      messageIds?: Array<Id<"messages">>;
    };
    const state = await getConvexClient().query(api.reactions.state, {
      threadId: body.threadId,
      messageIds: body.messageIds ?? [],
      actorHash: getActorHash(request),
      serverSecret: getServerSecret()
    });
    return NextResponse.json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reaction state failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
