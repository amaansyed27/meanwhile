import { mutation } from "./_generated/server";
import { searchText } from "./lib/text";

export const seedDemo = mutation({
  args: {},
  handler: async (ctx) => {
    if (process.env.MNWHL_ALLOW_SEEDING !== "true") {
      throw new Error("Set MNWHL_ALLOW_SEEDING=true before running seed data");
    }

    const existing = await ctx.db
      .query("threads")
      .withIndex("by_slug", (q) => q.eq("slug", "learning-rust-at-night"))
      .unique();
    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    const threadId = await ctx.db.insert("threads", {
      title: "learning rust at night",
      slug: "learning-rust-at-night",
      description: "small notes from a stubborn systems rabbit hole",
      status: "obsessed",
      ownerTokenIdentifier: "seed-owner",
      ownerSubject: "seed-owner",
      ownerName: "mnwhl",
      searchText: searchText(
        "learning rust at night",
        "small notes from a stubborn systems rabbit hole"
      ),
      heartCount: 0,
      messageCount: 3,
      createdAt: now - 86_400_000,
      updatedAt: now,
      lastMessageAt: now
    });

    const entries = [
      "borrow checker finally clicked in the smallest possible way. not mastery, just less fog.",
      "rewrote the parser twice and deleted more than i kept. good sign, maybe.",
      "2:13 am. enums feel like a language feature and a design critique at the same time."
    ];

    for (const [index, content] of entries.entries()) {
      await ctx.db.insert("messages", {
        threadId,
        content,
        ownerSubject: "seed-owner",
        ownerTokenIdentifier: "seed-owner",
        upvoteCount: 0,
        createdAt: now - (entries.length - index) * 3_600_000
      });
    }

    return threadId;
  }
});
