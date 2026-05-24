import { cache } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { getOptionalConvexClient } from "./convex";

export type PublicThread = Doc<"threads"> & {
  viewerHasHearted: boolean;
};

export type PublicMessage = Doc<"messages"> & {
  imageUrl: string | null;
  viewerHasUpvoted: boolean;
};

export type PublicThreadPageData = {
  thread: PublicThread;
  messages: PublicMessage[];
};

export const getPublicThreads = cache(async () => {
  const convex = getOptionalConvexClient();
  if (!convex) {
    return [] as PublicThread[];
  }

  try {
    return (await convex.query(api.threads.list, {
      includeArchived: true
    })) as PublicThread[];
  } catch {
    return [] as PublicThread[];
  }
});

export const getPublicThreadPageData = cache(async (slug: string) => {
  const convex = getOptionalConvexClient();
  if (!convex) {
    return null;
  }

  let thread: PublicThread | null;
  try {
    thread = (await convex.query(api.threads.getBySlug, {
      slug
    })) as PublicThread | null;
  } catch {
    return null;
  }

  if (!thread) {
    return null;
  }

  let messages: PublicMessage[];
  try {
    messages = (await convex.query(api.messages.list, {
      threadId: thread._id
    })) as PublicMessage[];
  } catch {
    messages = [];
  }

  return { thread, messages } satisfies PublicThreadPageData;
});

export function getThreadDescription(
  thread: Pick<PublicThread, "description" | "title">,
  messages: Array<Pick<PublicMessage, "content">>
) {
  const source =
    thread.description?.trim() ||
    [...messages].reverse().find((message) => message.content.trim().length > 0)
      ?.content ||
    `${thread.title} on mnwhl.`;

  return source.replace(/\s+/g, " ").slice(0, 155);
}
