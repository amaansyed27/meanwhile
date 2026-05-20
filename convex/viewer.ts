import { mutation, query } from "./_generated/server";
import { getIdentity, isOwnerIdentity, requireIdentity } from "./lib/auth";

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getIdentity(ctx);
    if (!identity) {
      return {
        isAuthenticated: false,
        isOwner: false
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    return {
      isAuthenticated: true,
      isOwner: isOwnerIdentity(identity),
      subject: identity.subject,
      email: identity.email,
      name: identity.name ?? identity.nickname ?? identity.email ?? "reader",
      imageUrl: identity.pictureUrl,
      user
    };
  }
});

export const upsertCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    const payload = {
      subject: identity.subject,
      email: identity.email,
      name: identity.name ?? identity.nickname ?? identity.email,
      imageUrl: identity.pictureUrl,
      lastSeenAt: now
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      ...payload,
      createdAt: now
    });
  }
});
