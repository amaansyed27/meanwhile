import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { displayName, getIdentity, requireIdentity, requireOwner } from "./lib/auth";
import { enforceRateLimit } from "./lib/rateLimit";
import { cleanMessage, normalizeUrl } from "./lib/text";
import { validateImageUpload } from "./lib/uploads";

async function withViewerVoteAndImage(ctx: QueryCtx, message: Doc<"messages">) {
  const identity = await getIdentity(ctx);
  const upvote = identity
    ? await ctx.db
        .query("messageUpvotes")
        .withIndex("by_message_user", (q) =>
          q
            .eq("messageId", message._id)
            .eq("userTokenIdentifier", identity.tokenIdentifier)
        )
        .unique()
    : null;

  const imageUrl = message.imageStorageId
    ? await ctx.storage.getUrl(message.imageStorageId)
    : null;

  return {
    ...message,
    imageUrl,
    viewerHasUpvoted: Boolean(upvote)
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
    filename: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await requireOwner(ctx);
    await enforceRateLimit(ctx, identity.tokenIdentifier, "post-message", 40, 60_000);

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
      ownerTokenIdentifier: identity.tokenIdentifier,
      ownerSubject: identity.subject,
      upvoteCount: 0,
      createdAt: now
    });

    if (args.imageStorageId && uploadMetadata) {
      await ctx.db.insert("uploads", {
        storageId: args.imageStorageId,
        uploadedByTokenIdentifier: identity.tokenIdentifier,
        uploadedBySubject: identity.subject,
        threadId: args.threadId,
        messageId,
        filename: args.filename,
        contentType: uploadMetadata.contentType,
        size: uploadMetadata.size,
        createdAt: now
      });
    }

    await ctx.db.patch(args.threadId, {
      ownerName: displayName(identity),
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
    linkUrl: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
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
    messageId: v.id("messages")
  },
  handler: async (ctx, args) => {
    await requireOwner(ctx);
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
    messageId: v.id("messages")
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    await enforceRateLimit(ctx, identity.tokenIdentifier, "upvote-message", 120, 60_000);

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const existing = await ctx.db
      .query("messageUpvotes")
      .withIndex("by_message_user", (q) =>
        q.eq("messageId", args.messageId).eq("userTokenIdentifier", identity.tokenIdentifier)
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
      userTokenIdentifier: identity.tokenIdentifier,
      createdAt: Date.now()
    });
    await ctx.db.patch(args.messageId, {
      upvoteCount: message.upvoteCount + 1
    });
    return true;
  }
});
