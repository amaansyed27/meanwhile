import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const statusValidator = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("abandoned"),
  v.literal("shipped"),
  v.literal("obsessed"),
  v.literal("archived")
);

export default defineSchema({
  threads: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    status: statusValidator,
    ownerName: v.optional(v.string()),
    searchText: v.string(),
    heartCount: v.number(),
    messageCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastMessageAt: v.optional(v.number())
  })
    .index("by_slug", ["slug"])
    .index("by_status_created", ["status", "createdAt"])
    .index("by_updated", ["updatedAt"])
    .searchIndex("search_threads", {
      searchField: "searchText",
      filterFields: ["status"]
    }),

  messages: defineTable({
    threadId: v.id("threads"),
    content: v.string(),
    linkUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    upvoteCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number())
  })
    .index("by_thread_created", ["threadId", "createdAt"])
    .index("by_thread_updated", ["threadId", "updatedAt"]),

  threadReactions: defineTable({
    threadId: v.id("threads"),
    actorHash: v.string(),
    createdAt: v.number()
  })
    .index("by_thread", ["threadId"])
    .index("by_thread_actorHash", ["threadId", "actorHash"])
    .index("by_actorHash", ["actorHash"]),

  messageUpvotes: defineTable({
    messageId: v.id("messages"),
    actorHash: v.string(),
    createdAt: v.number()
  })
    .index("by_message", ["messageId"])
    .index("by_message_actorHash", ["messageId", "actorHash"])
    .index("by_actorHash", ["actorHash"]),

  uploads: defineTable({
    storageId: v.id("_storage"),
    threadId: v.optional(v.id("threads")),
    messageId: v.optional(v.id("messages")),
    filename: v.optional(v.string()),
    contentType: v.string(),
    size: v.number(),
    createdAt: v.number()
  })
    .index("by_storage", ["storageId"])
    .index("by_thread", ["threadId"])
    .index("by_message", ["messageId"]),

  rateLimits: defineTable({
    key: v.string(),
    action: v.string(),
    windowStart: v.number(),
    count: v.number(),
    updatedAt: v.number()
  }).index("by_key_action", ["key", "action"])
});
