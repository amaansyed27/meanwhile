import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireServerSecret } from "./lib/secrets";

export const state = query({
  args: {
    serverSecret: v.string(),
    actorHash: v.string(),
    threadId: v.optional(v.id("threads")),
    messageIds: v.optional(v.array(v.id("messages")))
  },
  handler: async (ctx, args) => {
    requireServerSecret(ctx, args.serverSecret);

    const threadHearted = args.threadId
      ? Boolean(
          await ctx.db
            .query("threadReactions")
            .withIndex("by_thread_actorHash", (q) =>
              q.eq("threadId", args.threadId!).eq("actorHash", args.actorHash)
            )
            .unique()
        )
      : false;

    const upvotedMessageIds = [];
    for (const messageId of args.messageIds ?? []) {
      const upvote = await ctx.db
        .query("messageUpvotes")
        .withIndex("by_message_actorHash", (q) =>
          q.eq("messageId", messageId).eq("actorHash", args.actorHash)
        )
        .unique();
      if (upvote) {
        upvotedMessageIds.push(messageId);
      }
    }

    return {
      threadHearted,
      upvotedMessageIds
    };
  }
});
