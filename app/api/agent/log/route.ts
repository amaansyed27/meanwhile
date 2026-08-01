import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { getAppUrl } from "@/lib/site";
import { getConvexClient, getServerSecret } from "@/lib/server/convex";
import { requireAgentToken } from "@/lib/server/agent-auth";
import { THREAD_STATUSES } from "@/lib/status";

const agentEvents = [
  "note",
  "started",
  "decision",
  "blocked",
  "fixed",
  "verified",
  "shipped"
] as const;

const requestSchema = z
  .object({
    threadSlug: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    threadTitle: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).optional(),
    status: z.enum(THREAD_STATUSES).optional(),
    content: z.string().trim().min(1).max(4000),
    linkUrl: z.string().trim().url().max(2048).optional(),
    agentName: z.string().trim().min(1).max(80).default("agent"),
    runId: z.string().trim().min(1).max(160).optional(),
    event: z.enum(agentEvents).default("note")
  })
  .refine((value) => value.threadSlug || value.threadTitle, {
    message: "threadSlug or threadTitle is required"
  });

type Thread = Doc<"threads"> & {
  viewerHasHearted: boolean;
};

function titleFromSlug(slug: string) {
  return slug.replace(/-/g, " ");
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAgentToken(request);
  if (unauthorized) {
    return unauthorized;
  }

  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((issue) => issue.message).join("; ")
        : "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const convex = getConvexClient();
    const serverSecret = getServerSecret();
    let thread = body.threadSlug
      ? ((await convex.query(api.threads.getBySlug, {
          slug: body.threadSlug
        })) as Thread | null)
      : null;

    if (!thread) {
      const threadId = (await convex.mutation(api.threads.create, {
        title: body.threadTitle ?? titleFromSlug(body.threadSlug ?? body.agentName),
        slug: body.threadSlug,
        description:
          body.description ?? `live notes from ${body.agentName} while work unfolds.`,
        status: body.status ?? "active",
        source: "agent",
        agentName: body.agentName,
        agentRunId: body.runId,
        serverSecret
      })) as Id<"threads">;

      thread = (await convex.query(api.threads.get, { threadId })) as Thread | null;
    } else if (body.status && body.status !== thread.status) {
      await convex.mutation(api.threads.update, {
        threadId: thread._id,
        status: body.status,
        serverSecret
      });
      thread = {
        ...thread,
        status: body.status
      };
    }

    if (!thread) {
      throw new Error("Thread could not be created");
    }

    const messageId = (await convex.mutation(api.messages.post, {
      threadId: thread._id,
      content: body.content,
      linkUrl: body.linkUrl,
      source: "agent",
      agentName: body.agentName,
      agentRunId: body.runId,
      agentEvent: body.event,
      serverSecret
    })) as Id<"messages">;

    const threadUrl = `${getAppUrl()}/t/${thread.slug}`;

    return NextResponse.json({
      ok: true,
      threadId: thread._id,
      threadSlug: thread.slug,
      messageId,
      url: `${threadUrl}#message-${messageId}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent log failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
