"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Logo } from "@/components/app/logo";
import { MessageStream, type StreamMessage } from "@/components/app/message-stream";
import { StatusBadge } from "@/components/app/status-badge";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { ThreadStatus } from "@/lib/status";

type Thread = {
  _id: Id<"threads">;
  title: string;
  slug: string;
  description?: string;
  status: ThreadStatus;
  ownerName?: string;
  heartCount: number;
  messageCount: number;
  createdAt: number;
  lastMessageAt?: number;
  viewerHasHearted: boolean;
};

type ReactionState = {
  threadHearted: boolean;
  upvotedMessageIds: Array<Id<"messages">>;
};

async function postReaction(body: Record<string, unknown>) {
  const response = await fetch("/api/reactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const json = (await response.json()) as { error?: string };
    throw new Error(json.error ?? "Reaction failed");
  }
}

export function ReaderApp({
  initialSlug,
  initialThreads,
  initialThread,
  initialMessages
}: {
  initialSlug?: string;
  initialThreads?: Thread[];
  initialThread?: Thread | null;
  initialMessages?: StreamMessage[];
}) {
  const [search, setSearch] = useState("");
  const [reactionState, setReactionState] = useState<ReactionState>({
    threadHearted: false,
    upvotedMessageIds: []
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const queriedThreads = useQuery(api.threads.list, {
    search: search || undefined,
    includeArchived: true
  }) as Thread[] | undefined;
  const queriedThreadBySlug = useQuery(
    api.threads.getBySlug,
    initialSlug ? { slug: initialSlug } : "skip"
  ) as Thread | null | undefined;
  const threads = queriedThreads ?? (search ? undefined : initialThreads);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const threadBySlug = initialSlug
    ? queriedThreadBySlug === undefined
      ? initialThread
      : queriedThreadBySlug
    : null;
  const selected = initialSlug
    ? threadBySlug
    : threads?.[0] ?? initialThread ?? null;
  const queriedMessages = useQuery(
    api.messages.list,
    selected ? { threadId: selected._id } : "skip"
  ) as StreamMessage[] | undefined;
  const messages =
    queriedMessages ??
    (selected && selected._id === initialThread?._id ? initialMessages : undefined);

  useEffect(() => {
    if (!selected || !messages) {
      return;
    }
    void fetch("/api/reactions/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: selected._id,
        messageIds: messages.map((message) => message._id)
      })
    })
      .then((response) => response.json())
      .then((state: ReactionState) => setReactionState(state))
      .catch(() =>
        setReactionState({ threadHearted: false, upvotedMessageIds: [] })
      );
  }, [selected, messages]);

  const activeThreads = useMemo(
    () => threads?.filter((thread) => thread.status !== "archived") ?? [],
    [threads]
  );
  const archivedThreads = useMemo(
    () => threads?.filter((thread) => thread.status === "archived") ?? [],
    [threads]
  );
  const decoratedMessages = useMemo(() => {
    const upvoted = new Set(reactionState.upvotedMessageIds);
    return messages?.map((message) => ({
      ...message,
      viewerHasUpvoted: upvoted.has(message._id)
    }));
  }, [messages, reactionState.upvotedMessageIds]);

  return (
    <main className="min-h-screen md:grid md:grid-cols-[288px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-20 flex h-auto flex-col border-b border-border bg-background/95 backdrop-blur md:h-screen md:border-b-0 md:border-r">
        <div className="border-b border-border px-4 pb-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <Link href="/" aria-label="mnwhl home" className="min-w-0">
              <Logo />
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <div className="px-4 py-4">
          <label className="relative block">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <Input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="search threads"
              className="h-9 pl-9 font-mono text-xs"
            />
          </label>
        </div>
        <nav className="mnwhl-scrollbar flex gap-2 overflow-x-auto border-t border-border px-4 py-4 md:min-h-0 md:flex-1 md:flex-col md:overflow-y-auto md:py-4">
          <ThreadSection
            title="active"
            threads={activeThreads}
            pathname={pathname}
            selectedSlug={selected?.slug}
            loading={!threads}
          />
          {archivedThreads.length > 0 ? (
            <ThreadSection
              title="archived"
              threads={archivedThreads}
              pathname={pathname}
              selectedSlug={selected?.slug}
            />
          ) : null}
        </nav>
        <div className="hidden border-t border-border px-4 py-4 md:block">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase text-faint">read-only</span>
            <span className="font-mono text-[11px] text-muted">ip reactions</span>
          </div>
          <Link
            href="/owner"
            prefetch={false}
            className="font-mono text-[11px] text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            owner terminal
          </Link>
        </div>
      </aside>

      <section className="min-w-0 px-5 pb-20 pt-8 md:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <ThreadHeader
            thread={selected ? { ...selected, viewerHasHearted: reactionState.threadHearted } : null}
            loading={selected === undefined}
            onToggleHeart={(threadId) => {
              void postReaction({ action: "heartThread", threadId });
            }}
          />
          <MessageStream
            messages={decoratedMessages}
            loading={selected !== null && messages === undefined}
            onToggleUpvote={(messageId) => {
              void postReaction({ action: "upvoteMessage", messageId });
            }}
          />
        </div>
      </section>
    </main>
  );
}

function ThreadSection({
  title,
  threads,
  pathname,
  selectedSlug,
  loading = false
}: {
  title: string;
  threads: Thread[];
  pathname: string;
  selectedSlug?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="min-w-48 md:min-w-0">
        <p className="mb-2 font-mono text-[11px] uppercase text-faint">{title}</p>
        <div className="space-y-2">
          <div className="h-8 animate-pulse bg-border" />
          <div className="h-8 w-4/5 animate-pulse bg-border" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-56 md:min-w-0">
      <p className="mb-2 font-mono text-[11px] uppercase text-faint">{title}</p>
      <div className="flex gap-2 md:flex-col">
        {threads.map((thread) => {
          const href = `/t/${thread.slug}`;
          const selected = pathname === href || thread.slug === selectedSlug;
          return (
            <Link
              key={thread._id}
              href={href}
              className={`group block border px-3 py-2 text-sm transition hover:-translate-y-0.5 hover:translate-x-0.5 ${
                selected
                  ? "border-foreground bg-[#ede8dc] text-[#171716] dark:bg-[#2e2c28] dark:text-[#ede7db]"
                  : "border-transparent text-muted hover:border-border hover:bg-surface hover:text-foreground"
              }`}
            >
              <span className="block truncate lowercase">{thread.title}</span>
              <span
                className={`mt-1 block font-mono text-[10px] ${
                  selected ? "text-muted" : "text-faint"
                }`}
              >
                {thread.messageCount} updates
              </span>
            </Link>
          );
        })}
        {threads.length === 0 ? (
          <p className="text-sm text-muted">nothing here yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function ThreadHeader({
  thread,
  loading,
  onToggleHeart
}: {
  thread: Thread | null;
  loading: boolean;
  onToggleHeart: (threadId: Id<"threads">) => void;
}) {
  if (loading) {
    return (
      <header className="animate-pulse border-b border-border pb-8">
        <div className="h-10 w-2/3 bg-border" />
        <div className="mt-4 h-4 w-1/2 bg-border" />
      </header>
    );
  }

  if (!thread) {
    return (
      <header className="border-b border-border pb-8">
        <h1 className="text-3xl font-medium lowercase tracking-normal">mnwhl</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          a quiet place for ongoing things. no public threads have been started.
        </p>
      </header>
    );
  }

  return (
    <motion.header
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="border-b border-border pb-8"
    >
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={thread.status} />
        <span className="font-mono text-[11px] uppercase text-faint">
          since {formatDate(thread.createdAt)}
        </span>
      </div>
      <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="max-w-3xl text-4xl font-medium lowercase tracking-normal md:text-6xl">
            {thread.title}
          </h1>
          {thread.description ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
              {thread.description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase text-faint">
            {thread.messageCount} updates
          </span>
          <Button
            variant={thread.viewerHasHearted ? "solid" : "outline"}
            className="h-8"
            onClick={() => onToggleHeart(thread._id)}
          >
            <Heart size={14} className={thread.viewerHasHearted ? "fill-current" : ""} />
            {thread.heartCount}
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
