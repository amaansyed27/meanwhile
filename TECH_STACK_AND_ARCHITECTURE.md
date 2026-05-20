# mnwhl tech stack and architecture

## Product Shape

mnwhl is an asymmetric live-thread app. One owner publishes ongoing updates.
Authenticated readers can heart threads and upvote messages. There is no
comments system, feed algorithm, analytics dashboard, or public posting surface.

## Frontend Architecture

The frontend uses Next.js App Router with client components for realtime Convex
subscriptions.

- `app/page.tsx` renders the public reader.
- `app/t/[slug]/page.tsx` renders a specific public thread.
- `app/owner/page.tsx` renders the private owner dashboard.
- `app/layout.tsx` wires metadata, fonts, Clerk, Convex, and theme support.
- `proxy.ts` uses Clerk middleware to require sign-in for `/owner`.

The UI is intentionally low-container and typography-led. Reusable primitives
live in `components/ui`, while product surfaces live in `components/app`.

## Backend Architecture

Convex is the only backend. All persistence, realtime data, file storage, and
authorization-sensitive logic runs in Convex functions.

Backend modules:

- `convex/schema.ts`: database tables and indexes
- `convex/auth.config.ts`: Clerk JWT validation
- `convex/viewer.ts`: user identity and profile upsert
- `convex/threads.ts`: thread CRUD and hearts
- `convex/messages.ts`: message streaming, publishing, editing, deleting, upvotes
- `convex/uploads.ts`: owner-only upload URL generation
- `convex/seed.ts`: optional gated demo content
- `convex/lib/*`: shared backend helpers

## Convex Schema

Tables:

- `users`: mapped Clerk/Convex identities for session awareness
- `threads`: thread metadata, status, counts, slug, and searchable text
- `messages`: timestamped owner updates
- `threadReactions`: one heart per authenticated user per thread
- `messageUpvotes`: one upvote per authenticated user per message
- `uploads`: persisted image metadata linked to messages
- `rateLimits`: small transactional rate limit counters

Counts are denormalized on threads and messages to keep the public reader fast.
Reaction uniqueness is enforced transactionally by checking compound indexes
before insert/delete.

## Auth Flow

Clerk authenticates the user in the browser. `ConvexProviderWithClerk` fetches
Clerk tokens and sends them to Convex. Convex validates those tokens using the
issuer configured in `CLERK_JWT_ISSUER_DOMAIN`.

Client route protection is not treated as security-critical. Convex mutations
call either `requireIdentity` or `requireOwner`, deriving identity server-side
from `ctx.auth.getUserIdentity()`.

## Permission Model

Owner-only:

- create threads
- edit thread metadata
- delete threads
- post messages
- edit/delete messages
- generate upload URLs
- attach images

Authenticated readers:

- read all public threads
- heart threads
- upvote messages

Unauthenticated readers:

- read public threads
- see sign-in prompts for reactions

Owner configuration is controlled by Convex environment variables. Production
should use `MNWHL_OWNER_TOKEN_IDENTIFIERS`; subject/email fallback variables are
included only to make setup easier.

## Realtime Architecture

The public reader and owner dashboard use Convex `useQuery` subscriptions:

- thread list updates when metadata, hearts, or message counts change
- message stream updates immediately when the owner publishes or deletes
- reaction counts update after heart/upvote mutations

No client-side cache is treated as canonical. Optimistic feel comes from Convex's
live query refresh and small mutation surfaces.

## Image Upload Flow

1. Owner selects an image in the owner dashboard.
2. Client calls `uploads.generateUploadUrl`.
3. Convex verifies owner identity and rate limits the upload URL request.
4. Client uploads the file directly to Convex storage.
5. Client calls `messages.post` with the returned storage ID.
6. Convex validates MIME type and size, records upload metadata, and attaches the
   image to the message.
7. Queries return a serving URL with `ctx.storage.getUrl`.

Allowed image types are JPEG, PNG, WebP, and GIF. The current size limit is
8 MB.

## State Management

Server state lives in Convex. UI state is local and shallow:

- selected thread in the owner dashboard
- search input in the reader
- composer form state
- theme through `next-themes`

There is no global client store because the product does not need one.

## Component Organization

`components/app` contains product workflows:

- reader shell and sidebar
- message stream
- owner dashboard
- owner composer and thread controls
- auth and theme controls

`components/ui` contains reusable primitives:

- button
- input
- textarea

The app deliberately avoids broad component libraries except where small
primitive patterns are useful.

## Deployment Architecture

Vercel serves the Next.js application. Convex hosts database, functions, storage,
and realtime WebSocket infrastructure. Clerk hosts authentication.

Required production steps:

1. Configure Clerk application and Convex integration.
2. Set production Convex environment variables.
3. Run `npx convex deploy`.
4. Set Vercel environment variables.
5. Deploy the Next.js app.

## Scalability Considerations

The current architecture is suitable for a personal/public indie product:

- thread and message reads use indexes
- text search uses a Convex search index
- reactions use compound indexes
- counts avoid expensive aggregate reads
- uploads are stored outside document payloads

Future scaling work should add cursor pagination for very large message streams
and periodic cleanup for old rate-limit records.

## Security Decisions

- Backend authorization is mandatory for every mutation that changes data.
- Owner status is computed from Convex environment variables, not frontend state.
- User IDs are never accepted as authorization arguments.
- Uploaded images are validated after storage and before message attachment.
- Invalid uploaded images are deleted immediately.
- Text content is never rendered with `dangerouslySetInnerHTML`.
- Link URLs are normalized and protocol-restricted.
- Rate limits protect high-frequency writes.
- Secrets stay out of Git via `.gitignore` and `.env.example`.

## Tech Stack Rationale

Next.js App Router gives the app Vercel-ready routing, metadata, image handling,
and a clean client/server component boundary. Convex fits the live-thread model
because database writes automatically update subscribed clients. Clerk provides a
production auth surface without building password/session infrastructure. Tailwind
keeps the visual system small and explicit, which matches the product's
minimalist direction.
