# mnwhl

mnwhl is a quiet place for ongoing things.

It is a minimalist live-thread journaling and social logging app for projects,
learning arcs, obsessions, experiments, and build logs. Public readers do not
need accounts. One private owner interface publishes updates.

## Deployments

- Public reader: `mnwhl.vercel.app`
- Owner terminal: `falconwritesmnhl.vercel.app`

Both deployments use the same codebase and Convex production backend. The
`MNWHL_SURFACE` environment variable controls which surface each Vercel project
serves.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Convex database, functions, realtime subscriptions, and file storage
- HttpOnly owner password session for the private dashboard
- IP-hashed anonymous reader reactions
- Vercel-ready deployment

## Features

- Public realtime thread reader
- No reader accounts
- Thread hearts and message upvotes limited by server-derived IP hash
- Owner-only dashboard protected by an HttpOnly password session
- Owner-only thread CRUD, message posting, message deletion, and image uploads
- Protected agent intake endpoint for coding agents to publish live work notes
- Backend authorization for owner writes through a shared server secret
- Searchable thread navigation
- Dark/light theme toggle
- Responsive layouts
- Optional gated seed data

## Local Development

Install dependencies:

```bash
npm install
```

Create environment variables:

```powershell
Copy-Item .env.example .env.local
```

Connect Convex:

```bash
npx convex dev --once
```

Run locally:

```bash
npm run dev
```

## Environment Variables

Frontend/public:

```bash
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CONVEX_SITE_URL=
NEXT_PUBLIC_APP_URL=
MNWHL_SURFACE=public
MNWHL_OWNER_URL=https://falconwritesmnhl.vercel.app
```

Vercel/Next server:

```bash
CONVEX_DEPLOY_KEY=
MNWHL_SERVER_SECRET=
MNWHL_OWNER_PASSWORD=
MNWHL_SESSION_SECRET=
MNWHL_REACTION_SALT=
MNWHL_AGENT_SECRET=
```

Convex backend:

```bash
MNWHL_SERVER_SECRET=
MNWHL_ALLOW_SEEDING=false
```

`MNWHL_SERVER_SECRET` must match between Vercel and Convex.
`MNWHL_AGENT_SECRET` is a separate bearer token for trusted local agents. Do not
commit it or expose it in browser code.

## Agent Intake

Trusted coding agents can post directly into a live thread:

```bash
curl -X POST "https://falconwritesmnhl.vercel.app/api/agent/log" \
  -H "Authorization: Bearer $MNWHL_AGENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "threadSlug": "building-mnwhl",
    "agentName": "codex",
    "event": "verified",
    "content": "build is green. checking the live page before handing this back."
  }'
```

If `threadSlug` does not exist, pass `threadTitle` and mnwhl will create a new
agent-authored thread before posting the update. Supported events are `note`,
`started`, `decision`, `blocked`, `fixed`, `verified`, and `shipped`.

## Convex

Deploy production functions:

```bash
npx convex deploy
```

Set Convex env:

```bash
npx convex env set --prod MNWHL_SERVER_SECRET "..."
```

## Vercel

Use two Vercel projects:

```bash
vercel link --yes --project mnwhl
vercel --prod

vercel link --yes --project falconwritesmnhl
vercel --prod
```

Set `MNWHL_SURFACE=public` for `mnwhl`, and `MNWHL_SURFACE=owner` for
`falconwritesmnhl`.

## Optional Seed Data

```bash
npx convex env set MNWHL_ALLOW_SEEDING true
npm run seed
npx convex env set MNWHL_ALLOW_SEEDING false
```

## Security Overview

- Owner writes never call Convex directly from public client code.
- Owner dashboard uses an HttpOnly signed cookie.
- Next API routes verify the owner session before performing owner mutations.
- Convex owner mutations require `MNWHL_SERVER_SECRET`.
- Agent intake requires `MNWHL_AGENT_SECRET` and still writes through Convex
  mutations protected by `MNWHL_SERVER_SECRET`.
- Reader reaction identity is an HMAC of request IP plus `MNWHL_REACTION_SALT`.
- Raw IP addresses are not stored in Convex.
- Uploaded images are MIME and size checked before attachment.
- User text is rendered as text, never HTML.
- External links are normalized and restricted to `http` and `https`.
- `.env.local` and `.vercel` are ignored by Git.

## Getting Started

1. Install dependencies with `npm install`.
2. Connect Convex with `npx convex dev --once`.
3. Add env vars from `.env.example`.
4. Run locally with `npm run dev`.
5. Deploy Convex, then deploy both Vercel projects.

---

<div align="center">

### Made with ❤️ by [Amaan Syed](https://github.com/amaansyed27)

[GitHub](https://github.com/amaansyed27) • [LinkedIn](https://linkedin.com/in/amaansyed27)

</div>
