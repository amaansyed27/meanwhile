import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireServerSecret } from "./lib/secrets";
import { enforceRateLimit } from "./lib/rateLimit";

export const generateUploadUrl = mutation({
  args: {
    serverSecret: v.string()
  },
  handler: async (ctx, args) => {
    requireServerSecret(ctx, args.serverSecret);
    await enforceRateLimit(ctx, "owner", "upload-image", 30, 60_000);
    return await ctx.storage.generateUploadUrl();
  }
});
