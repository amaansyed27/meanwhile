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
  users: defineTable({
    tokenIdentifier: v.string(),
    subject: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    lastSeenAt: v.number(),
    createdAt: v.number()
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_subject", ["subject"])
    .index("by_email", ["email"]),

  threads: defineTable({
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    status: statusValidator,
    ownerTokenIdentifier: v.string(),
    ownerSubject: v.string(),
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
    ownerTokenIdentifier: v.string(),
    ownerSubject: v.string(),
    upvoteCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number())
  })
    .index("by_thread_created", ["threadId", "createdAt"])
    .index("by_thread_updated", ["threadId", "updatedAt"]),

  threadReactions: defineTable({
    threadId: v.id("threads"),
    userTokenIdentifier: v.string(),
    createdAt: v.number()
  })
    .index("by_thread", ["threadId"])
    .index("by_thread_user", ["threadId", "userTokenIdentifier"])
    .index("by_user", ["userTokenIdentifier"]),

  messageUpvotes: defineTable({
    messageId: v.id("messages"),
    userTokenIdentifier: v.string(),
    createdAt: v.number()
  })
    .index("by_message", ["messageId"])
    .index("by_message_user", ["messageId", "userTokenIdentifier"])
    .index("by_user", ["userTokenIdentifier"]),

  uploads: defineTable({
    storageId: v.id("_storage"),
    uploadedByTokenIdentifier: v.string(),
    uploadedBySubject: v.string(),
    threadId: v.optional(v.id("threads")),
    messageId: v.optional(v.id("messages")),
    filename: v.optional(v.string()),
    contentType: v.string(),
    size: v.number(),
    createdAt: v.number()
  })
    .index("by_storage", ["storageId"])
    .index("by_thread", ["threadId"])
    .index("by_message", ["messageId"])
    .index("by_uploadedByTokenIdentifier", ["uploadedByTokenIdentifier"]),

  rateLimits: defineTable({
    key: v.string(),
    action: v.string(),
    windowStart: v.number(),
    count: v.number(),
    updatedAt: v.number()
  }).index("by_key_action", ["key", "action"])
});
