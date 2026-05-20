import type { UserIdentity } from "convex/server";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx;

function splitEnv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function getIdentity(ctx: AuthCtx) {
  return await ctx.auth.getUserIdentity();
}

export async function requireIdentity(ctx: AuthCtx) {
  const identity = await getIdentity(ctx);
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity;
}

export function isOwnerIdentity(identity: UserIdentity | null) {
  if (!identity) {
    return false;
  }

  const tokenIdentifiers = splitEnv(process.env.MNWHL_OWNER_TOKEN_IDENTIFIERS);
  const subjects = splitEnv(process.env.MNWHL_OWNER_SUBJECTS);
  const emails = splitEnv(process.env.MNWHL_OWNER_EMAILS).map((email) =>
    email.toLowerCase()
  );
  const email = identity.email?.toLowerCase();

  return (
    tokenIdentifiers.includes(identity.tokenIdentifier) ||
    subjects.includes(identity.subject) ||
    (email !== undefined && emails.includes(email))
  );
}

export async function requireOwner(ctx: AuthCtx) {
  const identity = await requireIdentity(ctx);
  if (!isOwnerIdentity(identity)) {
    throw new Error("Unauthorized");
  }
  return identity;
}

export function displayName(identity: UserIdentity) {
  return identity.name ?? identity.nickname ?? identity.email ?? "mnwhl";
}
