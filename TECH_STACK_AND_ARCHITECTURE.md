# mnwhl tech stack and architecture

## Product Shape

mnwhl is an asymmetric live-thread app. Public readers do not have accounts.
They can read, heart threads, and upvote messages. One owner uses a separate
private terminal to create threads and publish updates.

## Deployment Architecture

The same Next.js codebase is deployed twice:

- `mnwhl.vercel.app`: public reader, `MNWHL_SURFACE=public`
- `falconwritesmnhl.vercel.app`: owner terminal, `MNWHL_SURFACE=owner`

Both deployments share one Convex production backend:

- Cloud URL: `https://giddy-dachshund-425.convex.cloud`
- HTTP actions URL: `https://giddy-dachshund-425.convex.site`

## Frontend Architecture

- `app/page.tsx`: public reader, or redirects to `/owner` on owner deployment
- `app/t/[slug]/page.tsx`: public thread route
- `app/owner/page.tsx`: owner dashboard, or redirects to owner deployment on
  public surface
- `app/api/owner/*`: password login, logout, session, and owner RPC
- `app/api/reactions/*`: anonymous IP-hashed reaction endpoints
- `components/app`: product UI
- `components/ui`: small reusable primitives

Public reads use Convex realtime queries directly. Mutating operations go
through Next API routes when they require server-derived identity or owner
authorization.

## Backend Architecture

Convex stores all durable data:

- `threads`
- `messages`
- `threadReactions`
- `messageUpvotes`
- `uploads`
- `rateLimits`

Convex modules:

- `convex/schema.ts`: tables and indexes
- `convex/threads.ts`: thread reads, owner mutations, anonymous hearts
- `convex/messages.ts`: message reads, owner posting/deletion, anonymous upvotes
- `convex/reactions.ts`: reaction state lookup for IP-hashed readers
- `convex/uploads.ts`: owner-only upload URL generation
- `convex/lib/secrets.ts`: server secret enforcement
- `convex/lib/rateLimit.ts`: write throttling

## Owner Auth Flow

The owner enters `MNWHL_OWNER_PASSWORD` on the owner deployment. Next.js verifies
the password and sets a signed HttpOnly cookie using `MNWHL_SESSION_SECRET`.

Owner writes work like this:

1. Browser calls `/api/owner/rpc`.
2. Next verifies the owner cookie.
3. Next calls Convex with `MNWHL_SERVER_SECRET`.
4. Convex verifies the secret before changing data.

The secret is never exposed to browser JavaScript.

## Reader Reaction Flow

Readers do not sign in.

1. Browser calls `/api/reactions`.
2. Next derives the request IP from Vercel forwarding headers.
3. Next stores only `HMAC(ip, MNWHL_REACTION_SALT)` in Convex.
4. Convex uses compound indexes to allow one heart/upvote per hashed actor.

This is intentionally simple. It avoids accounts while preventing repeated votes
from the same IP hash.

## Realtime Architecture

The public reader subscribes to:

- `threads.list`
- `threads.getBySlug`
- `messages.list`

After a reaction, Convex count changes flow back through realtime queries.
Reaction selected state is fetched through `/api/reactions/state`, which uses the
same IP hash.

## Image Upload Flow

1. Owner dashboard asks `/api/owner/rpc` for an upload URL.
2. Next verifies owner session and calls Convex.
3. Browser uploads directly to Convex storage.
4. Owner posts a message with the returned storage ID.
5. Convex validates MIME type and size before attaching it.

Allowed types: JPEG, PNG, WebP, GIF. Max size: 8 MB.

## Security Decisions

- No reader accounts or public auth provider.
- No raw IP addresses are stored.
- Owner writes require both an HttpOnly session and Convex server secret.
- Convex never trusts client-provided ownership.
- Text is not rendered as HTML.
- URLs are normalized and protocol-restricted.
- Uploads are checked server-side.
- Rate limits exist for owner writes and public reactions.
- Secrets stay in Vercel/Convex environment variables, not source control.

## Scalability Notes

The data model uses indexes for thread lookup, message streams, reaction
uniqueness, and search. Counts are denormalized for fast reader rendering.

Future improvements:

- Cursor pagination for very long threads
- Cleanup job for old rate-limit windows
- Optional owner draft mode
- Public RSS feeds per thread
