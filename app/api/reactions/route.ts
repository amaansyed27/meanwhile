import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getConvexClient, getServerSecret } from "@/lib/server/convex";
import { getActorHash } from "@/lib/server/ip";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: "heartThread" | "upvoteMessage";
      threadId?: Id<"threads">;
      messageId?: Id<"messages">;
    };
    const convex = getConvexClient();
    const actorHash = getActorHash(request);
    const serverSecret = getServerSecret();

    if (body.action === "heartThread" && body.threadId) {
      const active = await convex.mutation(api.threads.toggleHeart, {
        threadId: body.threadId,
        actorHash,
        serverSecret
      });
      return NextResponse.json({ active });
    }

    if (body.action === "upvoteMessage" && body.messageId) {
      const active = await convex.mutation(api.messages.toggleUpvote, {
        messageId: body.messageId,
        actorHash,
        serverSecret
      });
      return NextResponse.json({ active });
    }

    return NextResponse.json({ error: "Invalid reaction action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reaction failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
