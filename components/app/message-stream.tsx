"use client";

import Image from "next/image";
import { ArrowUp, ExternalLink } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { formatShortTime } from "@/lib/utils";

export type StreamMessage = {
  _id: Id<"messages">;
  content: string;
  linkUrl?: string;
  imageUrl?: string | null;
  upvoteCount: number;
  createdAt: number;
  viewerHasUpvoted: boolean;
};

export function MessageStream({
  messages,
  loading,
  onToggleUpvote
}: {
  messages: StreamMessage[] | undefined;
  loading: boolean;
  onToggleUpvote: (messageId: Id<"messages">) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-8 py-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="mb-3 h-3 w-24 bg-border" />
            <div className="h-4 w-3/4 bg-border" />
          </div>
        ))}
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="py-20 text-sm leading-6 text-muted">
        no updates yet. quiet can be useful too.
      </div>
    );
  }

  return (
    <ol className="space-y-10 py-8">
      {messages.map((message) => (
        <MessageRow
          key={message._id}
          message={message}
          onToggleUpvote={onToggleUpvote}
        />
      ))}
    </ol>
  );
}

function MessageRow({
  message,
  onToggleUpvote
}: {
  message: StreamMessage;
  onToggleUpvote: (messageId: Id<"messages">) => void;
}) {
  return (
    <li
      id={`message-${message._id}`}
      className="group grid gap-3 border-l border-border pl-4 md:grid-cols-[112px_minmax(0,1fr)] md:border-l-0 md:pl-0"
    >
      <time
        dateTime={new Date(message.createdAt).toISOString()}
        className="font-mono text-[11px] uppercase tracking-normal text-faint md:pt-1"
      >
        {formatShortTime(message.createdAt)}
      </time>
      <article className="min-w-0">
        <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground">
          {message.content}
        </p>
        {message.linkUrl ? (
          <a
            href={message.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 border-b border-border pb-0.5 text-sm text-muted transition hover:border-foreground hover:text-foreground"
          >
            <ExternalLink size={14} />
            {message.linkUrl}
          </a>
        ) : null}
        {message.imageUrl ? (
          <div className="mt-5 w-full max-w-2xl border border-border bg-surface p-1">
            <Image
              src={message.imageUrl}
              alt=""
              width={1200}
              height={760}
              unoptimized
              className="h-auto w-full object-cover grayscale"
            />
          </div>
        ) : null}
        <div className="mt-3">
          <Button
            className="h-7 gap-1 border-0 px-0 font-mono text-[11px] text-muted hover:bg-transparent hover:text-foreground"
            onClick={() => onToggleUpvote(message._id)}
            aria-label={message.viewerHasUpvoted ? "remove upvote" : "upvote message"}
          >
            <ArrowUp
              size={13}
              className={message.viewerHasUpvoted ? "fill-current" : ""}
            />
            {message.upvoteCount}
          </Button>
        </div>
      </article>
    </li>
  );
}
