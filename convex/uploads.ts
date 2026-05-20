import { mutation } from "./_generated/server";
import { requireOwner } from "./lib/auth";
import { enforceRateLimit } from "./lib/rateLimit";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireOwner(ctx);
    await enforceRateLimit(ctx, identity.tokenIdentifier, "upload-image", 30, 60_000);
    return await ctx.storage.generateUploadUrl();
  }
});
