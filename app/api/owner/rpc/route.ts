import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getConvexClient, getServerSecret } from "@/lib/server/convex";
import { requireOwnerSession } from "@/lib/server/owner-session";
import type { ThreadStatus } from "@/lib/status";

type OwnerAction =
  | "createThread"
  | "updateThread"
  | "deleteThread"
  | "postMessage"
  | "deleteMessage"
  | "uploadUrl";

export async function POST(request: NextRequest) {
  const unauthorized = await requireOwnerSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const body = (await request.json()) as {
      action?: OwnerAction;
      args?: Record<string, unknown>;
    };
    const action = body.action;
    const args = body.args ?? {};
    const convex = getConvexClient();
    const serverSecret = getServerSecret();

    switch (action) {
      case "createThread": {
        const id = await convex.mutation(api.threads.create, {
          title: String(args.title ?? ""),
          description:
            typeof args.description === "string" ? args.description : undefined,
          status: (args.status as ThreadStatus | undefined) ?? "active",
          serverSecret
        });
        return NextResponse.json({ id });
      }
      case "updateThread": {
        await convex.mutation(api.threads.update, {
          threadId: args.threadId as Id<"threads">,
          title: typeof args.title === "string" ? args.title : undefined,
          description:
            typeof args.description === "string" ? args.description : undefined,
          status: args.status as ThreadStatus | undefined,
          serverSecret
        });
        return NextResponse.json({ ok: true });
      }
      case "deleteThread": {
        await convex.mutation(api.threads.remove, {
          threadId: args.threadId as Id<"threads">,
          serverSecret
        });
        return NextResponse.json({ ok: true });
      }
      case "postMessage": {
        const id = await convex.mutation(api.messages.post, {
          threadId: args.threadId as Id<"threads">,
          content: String(args.content ?? ""),
          linkUrl: typeof args.linkUrl === "string" ? args.linkUrl : undefined,
          imageStorageId: args.imageStorageId as Id<"_storage"> | undefined,
          filename: typeof args.filename === "string" ? args.filename : undefined,
          serverSecret
        });
        return NextResponse.json({ id });
      }
      case "deleteMessage": {
        await convex.mutation(api.messages.remove, {
          messageId: args.messageId as Id<"messages">,
          serverSecret
        });
        return NextResponse.json({ ok: true });
      }
      case "uploadUrl": {
        const uploadUrl = await convex.mutation(api.uploads.generateUploadUrl, {
          serverSecret
        });
        return NextResponse.json({ uploadUrl });
      }
      default:
        return NextResponse.json({ error: "Unknown owner action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Owner action failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
