import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = MutationCtx | QueryCtx;

export function requireServerSecret(_ctx: Ctx, provided: string) {
  const expected = process.env.MNWHL_SERVER_SECRET;
  if (!expected || provided.length === 0 || provided !== expected) {
    throw new Error("Unauthorized");
  }
}
