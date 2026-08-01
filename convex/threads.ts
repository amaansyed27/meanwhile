import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { messageSourceValidator, statusValidator } from "./schema";
import { requireServerSecret } from "./lib/secrets";
import { enforceRateLimit } from "./lib/rateLimit";
import {
  cleanOptionalText,
  cleanText,
  makeSlug,
  searchText
} from "./lib/text";

async function uniqueSlug(ctx: MutationCtx, title: string, requestedSlug?: string) {
  const base = requestedSlug ? makeSlug(requestedSlug) : makeSlug(title);
  let candidate = base;
  let suffix = 2;

  while (
    await ctx.db
      .query("threads")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .unique()
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

async function withViewerHeart(_ctx: QueryCtx, thread: Doc<"threads">) {
  return { ...thread, viewerHasHearted: false };
}

export const list = query({
  args: {
    search: v.optional(v.string()),
    includeArchived: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const includeArchived = args.includeArchived ?? true;
    const normalized = args.search?.trim();

    const rows =
      normalized && normalized.length > 0
        ? await ctx.db
            .query("threads")
            .withSearchIndex("search_threads", (q) => q.search("searchText", normalized))
            .take(100)
        : await ctx.db.query("threads").withIndex("by_updated").order("desc").take(100);

    const filtered = includeArchived
      ? rows
      : rows.filter((thread) => thread.status !== "archived");

    return await Promise.all(filtered.map((thread) => withViewerHeart(ctx, thread)));
  }
});

export const getBySlug = query({
  args: {
    slug: v.string()
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("threads")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!thread) {
      return null;
    }

    return await withViewerHeart(ctx, thread);
  }
});

export const get = query({
  args: {
    threadId: v.id("threads")
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      return null;
    }

    return await withViewerHeart(ctx, thread);
  }
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(statusValidator),
    source: v.optional(messageSourceValidator),
    agentName: v.optional(v.string()),
    agentRunId: v.optional(v.string()),
    serverSecret: v.string()
  },
  handler: async (ctx, args) => {
    requireServerSecret(ctx, args.serverSecret);
    const source = args.source ?? "owner";
    const agentName = cleanOptionalText(args.agentName, 80);
    const agentRunId = cleanOptionalText(args.agentRunId, 160);
    await enforceRateLimit(
      ctx,
      source === "agent" ? `agent:${agentName ?? "unknown"}` : "owner",
      source === "agent" ? "create-agent-thread" : "create-thread",
      source === "agent" ? 30 : 10,
      60_000
    );

    const now = Date.now();
    const title = cleanText(args.title, 120);
    const description = cleanOptionalText(args.description, 500);
    const slug = await uniqueSlug(ctx, title, args.slug);

    return await ctx.db.insert("threads", {
      title,
      slug,
      description,
      status: args.status ?? "active",
      ownerName: "mnwhl",
      source,
      agentName,
      agentRunId,
      searchText: searchText(title, description),
      heartCount: 0,
      messageCount: 0,
      createdAt: now,
      updatedAt: now
    });
  }
});

export const update = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(statusValidator),
    serverSecret: v.string()
  },
  handler: async (ctx, args) => {
    requireServerSecret(ctx, args.serverSecret);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    const title = args.title === undefined ? thread.title : cleanText(args.title, 120);
    const description =
      args.description === undefined
        ? thread.description
        : cleanOptionalText(args.description, 500);

    await ctx.db.patch(args.threadId, {
      title,
      description,
      status: args.status ?? thread.status,
      searchText: searchText(title, description),
      updatedAt: Date.now()
    });
  }
});

export const remove = mutation({
  args: {
    threadId: v.id("threads"),
    serverSecret: v.string()
  },
  handler: async (ctx, args) => {
    requireServerSecret(ctx, args.serverSecret);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread_created", (q) => q.eq("threadId", args.threadId))
      .collect();
    for (const message of messages) {
      const upvotes = await ctx.db
        .query("messageUpvotes")
        .withIndex("by_message", (q) => q.eq("messageId", message._id))
        .collect();
      for (const upvote of upvotes) {
        await ctx.db.delete(upvote._id);
      }
      await ctx.db.delete(message._id);
    }

    const hearts = await ctx.db
      .query("threadReactions")
      .withIndex("by_thread", (q) => q.eq("threadId", args.threadId))
      .collect();
    for (const heart of hearts) {
      await ctx.db.delete(heart._id);
    }

    await ctx.db.delete(args.threadId);
  }
});

export const toggleHeart = mutation({
  args: {
    threadId: v.id("threads"),
    actorHash: v.string(),
    serverSecret: v.string()
  },
  handler: async (ctx, args) => {
    requireServerSecret(ctx, args.serverSecret);
    await enforceRateLimit(ctx, args.actorHash, "heart-thread", 60, 60_000);
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    const existing = await ctx.db
      .query("threadReactions")
      .withIndex("by_thread_actorHash", (q) =>
        q.eq("threadId", args.threadId).eq("actorHash", args.actorHash)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.threadId, {
        heartCount: Math.max(0, thread.heartCount - 1),
        updatedAt: Date.now()
      });
      return false;
    }

    await ctx.db.insert("threadReactions", {
      threadId: args.threadId,
      actorHash: args.actorHash,
      createdAt: Date.now()
    });
    await ctx.db.patch(args.threadId, {
      heartCount: thread.heartCount + 1,
      updatedAt: Date.now()
    });
    return true;
  }
});
