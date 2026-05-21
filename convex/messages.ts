import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { requireServerSecret } from "./lib/secrets";
import { enforceRateLimit } from "./lib/rateLimit";
import { cleanMessage, normalizeUrl } from "./lib/text";
import { validateImageUpload } from "./lib/uploads";

async function withViewerVoteAndImage(ctx: QueryCtx, message: Doc<"messages">) {
  const imageUrl = message.imageStorageId
    ? await ctx.storage.getUrl(message.imageStorageId)
    : null;

  return {
    ...message,
    imageUrl,
    viewerHasUpvoted: false
  };
}

export const list = query({
  args: {
    threadId: v.id("threads")
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_thread_created", (q) => q.eq("threadId", args.threadId))
      .order("asc")
      .collect();

    return await Promise.all(
      messages.map((message) => withViewerVoteAndImage(ctx, message))
    );
  }
});

export const post = mutation({
  args: {
    threadId: v.id("threads"),
    content: v.string(),
    linkUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    filename: v.optional(v.string()),
    serverSecret: v.string()
  },
  handler: async (ctx, args) => {
    requireServerSecret(ctx, args.serverSecret);
    await enforceRateLimit(ctx, "owner", "post-message", 40, 60_000);

    const thread = await ctx.db.get(args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    const now = Date.now();
    const content = cleanMessage(args.content);
    const linkUrl = normalizeUrl(args.linkUrl);
    let uploadMetadata: { contentType: string; size: number } | null = null;

    if (args.imageStorageId) {
      uploadMetadata = await validateImageUpload(ctx, args.imageStorageId);
    }

    const messageId = await ctx.db.insert("messages", {
      threadId: args.threadId,
      content,
      linkUrl,
      imageStorageId: args.imageStorageId,
      upvoteCount: 0,
      createdAt: now
    });

    if (args.imageStorageId && uploadMetadata) {
      await ctx.db.insert("uploads", {
        storageId: args.imageStorageId,
        threadId: args.threadId,
        messageId,
        filename: args.filename,
        contentType: uploadMetadata.contentType,
        size: uploadMetadata.size,
        createdAt: now
      });
    }

    await ctx.db.patch(args.threadId, {
      ownerName: "mnwhl",
      messageCount: thread.messageCount + 1,
      lastMessageAt: now,
      updatedAt: now
    });

    return messageId;
  }
});

export const update = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    linkUrl: v.optional(v.string()),
    serverSecret: v.string()
  },
  handler: async (ctx, args) => {
    requireServerSecret(ctx, args.serverSecret);
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    await ctx.db.patch(args.messageId, {
      content: cleanMessage(args.content),
      linkUrl: normalizeUrl(args.linkUrl),
      updatedAt: Date.now()
    });
  }
});

export const remove = mutation({
  args: {
    messageId: v.id("messages"),
    serverSecret: v.string()
  },
  handler: async (ctx, args) => {
    requireServerSecret(ctx, args.serverSecret);
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }
    const thread = await ctx.db.get(message.threadId);

    const upvotes = await ctx.db
      .query("messageUpvotes")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();
    for (const upvote of upvotes) {
      await ctx.db.delete(upvote._id);
    }

    const uploads = await ctx.db
      .query("uploads")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .collect();
    for (const upload of uploads) {
      await ctx.storage.delete(upload.storageId);
      await ctx.db.delete(upload._id);
    }

    await ctx.db.delete(args.messageId);
    if (thread) {
      await ctx.db.patch(message.threadId, {
        messageCount: Math.max(0, thread.messageCount - 1),
        updatedAt: Date.now()
      });
    }
  }
});

export const toggleUpvote = mutation({
  args: {
    messageId: v.id("messages"),
    actorHash: v.string(),
    serverSecret: v.string()
  },
  handler: async (ctx, args) => {
    requireServerSecret(ctx, args.serverSecret);
    await enforceRateLimit(ctx, args.actorHash, "upvote-message", 120, 60_000);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const existing = await ctx.db
      .query("messageUpvotes")
      .withIndex("by_message_actorHash", (q) =>
        q.eq("messageId", args.messageId).eq("actorHash", args.actorHash)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.messageId, {
        upvoteCount: Math.max(0, message.upvoteCount - 1)
      });
      return false;
    }

    await ctx.db.insert("messageUpvotes", {
      messageId: args.messageId,
      actorHash: args.actorHash,
      createdAt: Date.now()
    });
    await ctx.db.patch(args.messageId, {
      upvoteCount: message.upvoteCount + 1
    });
    return true;
  }
});
