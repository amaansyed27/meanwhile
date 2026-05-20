import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

export async function validateImageUpload(
  ctx: MutationCtx,
  storageId: Id<"_storage">
) {
  const metadata = await ctx.db.system.get(storageId);
  if (!metadata) {
    throw new Error("Uploaded file was not found");
  }

  const contentType = metadata.contentType ?? "application/octet-stream";
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    await ctx.storage.delete(storageId);
    throw new Error("Only jpeg, png, webp, and gif images are allowed");
  }

  if (metadata.size > MAX_IMAGE_SIZE_BYTES) {
    await ctx.storage.delete(storageId);
    throw new Error("Images must be 8 MB or smaller");
  }

  return {
    contentType,
    size: metadata.size
  };
}
