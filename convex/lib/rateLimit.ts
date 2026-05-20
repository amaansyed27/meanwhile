import type { MutationCtx } from "../_generated/server";

export async function enforceRateLimit(
  ctx: MutationCtx,
  key: string,
  action: string,
  limit: number,
  windowMs: number
) {
  const now = Date.now();
  const record = await ctx.db
    .query("rateLimits")
    .withIndex("by_key_action", (q) => q.eq("key", key).eq("action", action))
    .unique();

  if (!record || now - record.windowStart >= windowMs) {
    if (record) {
      await ctx.db.patch(record._id, {
        windowStart: now,
        count: 1,
        updatedAt: now
      });
    } else {
      await ctx.db.insert("rateLimits", {
        key,
        action,
        windowStart: now,
        count: 1,
        updatedAt: now
      });
    }
    return;
  }

  if (record.count >= limit) {
    throw new Error("Too many requests. Try again in a moment.");
  }

  await ctx.db.patch(record._id, {
    count: record.count + 1,
    updatedAt: now
  });
}
