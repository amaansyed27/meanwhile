# mnwhl

mnwhl is a quiet place for ongoing things.

It is a minimalist live-thread journaling and social logging app for projects,
learning arcs, obsessions, experiments, and build logs. One owner publishes
timestamped updates into ongoing threads. Everyone else can read, heart threads,
and upvote individual messages.

The interface is intentionally restrained: monochrome, paper-like, compact, and
low-noise. It should feel closer to an intimate log than a feed or dashboard.

## Screenshots

Add production screenshots here after your Clerk and Convex environments are
connected.

- Public thread reader
- Owner publishing terminal
- Mobile thread view
- Dark mode

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Convex database, functions, realtime subscriptions, and file storage
- Clerk authentication
- Framer Motion for subtle page entrance motion
- Vercel-ready deployment

## Features

- Public thread reader with realtime Convex subscriptions
- Owner-only dashboard for creating, editing, deleting, and publishing threads
- Owner-only image uploads through Convex file storage
- Authenticated thread hearts and message upvotes
- Backend authorization checks for every protected mutation
- Searchable thread navigation
- Active and archived thread sections
- Dark/light theme toggle
- Responsive desktop and mobile layouts
- Loading, empty, and error states
- Optional gated seed data

## Local Development

Install dependencies:

```bash
npm install
```

Create environment variables:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

## Convex Setup

This repo is already wired for Convex. Start by provisioning or reconnecting the
development deployment:

```bash
npx convex dev --once
```

Then set the Clerk issuer domain in Convex. Use the Clerk Frontend API URL from
the Clerk Convex integration page:

```bash
npx convex env set CLERK_JWT_ISSUER_DOMAIN https://your-clerk-domain.clerk.accounts.dev
```

Set owner identifiers in Convex. Prefer `MNWHL_OWNER_TOKEN_IDENTIFIERS` because
Convex token identifiers are the most stable backend authorization key:

```bash
npx convex env set MNWHL_OWNER_TOKEN_IDENTIFIERS "https://your-clerk-domain.clerk.accounts.dev|user_xxx"
```

You can also set `MNWHL_OWNER_SUBJECTS` or `MNWHL_OWNER_EMAILS` as a setup
fallback, but production should use token identifiers.

## Clerk Setup

1. Create a Clerk application at [Clerk Dashboard](https://dashboard.clerk.com/apps/new).
2. Enable the Convex integration at [Clerk Convex setup](https://dashboard.clerk.com/apps/setup/convex).
3. Copy the publishable and secret keys into `.env.local`.
4. Copy the Clerk Frontend API URL into Convex as `CLERK_JWT_ISSUER_DOMAIN`.

Required local variables:

```bash
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

Convex backend variables:

```bash
CLERK_JWT_ISSUER_DOMAIN=
MNWHL_OWNER_TOKEN_IDENTIFIERS=
MNWHL_OWNER_SUBJECTS=
MNWHL_OWNER_EMAILS=
MNWHL_ALLOW_SEEDING=false
```

## Run Locally

Run the Convex watcher and Next.js dev server together:

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Optional Seed Data

Seed data is disabled by default and never appears from a local array in the UI.
It is inserted into Convex only when explicitly enabled:

```bash
npx convex env set MNWHL_ALLOW_SEEDING true
npm run seed
npx convex env set MNWHL_ALLOW_SEEDING false
```

## Deployment

Deploy Convex production functions:

```bash
npx convex deploy
```

In Vercel, set:

- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

In the Convex production dashboard, set:

- `CLERK_JWT_ISSUER_DOMAIN`
- `MNWHL_OWNER_TOKEN_IDENTIFIERS`
- optional fallback `MNWHL_OWNER_SUBJECTS`
- optional fallback `MNWHL_OWNER_EMAILS`

Then deploy to Vercel:

```bash
vercel
```

## Project Structure

```text
app/                         Next.js App Router routes and metadata assets
components/app/              product-specific reader, owner, auth, and theme UI
components/ui/               small reusable UI primitives
convex/                      schema, auth config, queries, mutations, storage
convex/lib/                  backend-only auth, rate limit, upload, and text helpers
lib/                         frontend utilities and shared UI constants
public/                      logo assets used by the application shell
assets/                      original provided brand assets
```

## Authentication Overview

Clerk owns user login. Convex validates Clerk JWTs through
`convex/auth.config.ts`, and all protected mutations derive identity from
`ctx.auth.getUserIdentity()`.

The `/owner` route is protected by Clerk proxy middleware for sign-in, but that
is only a convenience gate. Real owner permission checks happen in Convex through
`requireOwner`.

## Security Overview

- No mutation trusts client-provided ownership.
- Owner-only publishing, editing, deleting, and upload URL generation are
  enforced in Convex.
- Image uploads are finalized only after MIME type and size checks.
- User-generated text is rendered as text, never as HTML.
- External links are normalized and restricted to `http` and `https`.
- Rate limits exist for thread creation, publishing, uploads, hearts, and
  upvotes.
- Environment variables are documented in `.env.example`; `.env.local` is
  ignored by Git.
- npm audit currently reports zero vulnerabilities.

## Future Improvements

- Cursor pagination for very long threads
- Owner draft mode
- Thread cover image support
- Public RSS feeds per thread
- Export thread to Markdown
- More granular analytics for the owner dashboard

## Getting Started

1. Install dependencies with `npm install`.
2. Connect Convex with `npx convex dev --once`, then set Convex env vars.
3. Add Clerk keys to `.env.local` and run `npm run dev`.
4. Deploy Convex with `npx convex deploy`, then deploy the Next app to Vercel.
5. Required environment variables are listed in `.env.example`.
