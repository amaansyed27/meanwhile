"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ImageIcon,
  LinkIcon,
  LogOut,
  Plus,
  Save,
  Send,
  Trash2
} from "lucide-react";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/app/logo";
import { StatusBadge } from "@/components/app/status-badge";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { THREAD_STATUSES, type ThreadStatus } from "@/lib/status";
import { formatShortTime } from "@/lib/utils";

type Thread = {
  _id: Id<"threads">;
  title: string;
  slug: string;
  description?: string;
  status: ThreadStatus;
  heartCount: number;
  messageCount: number;
  updatedAt: number;
};

type Message = {
  _id: Id<"messages">;
  content: string;
  linkUrl?: string;
  imageUrl?: string | null;
  upvoteCount: number;
  createdAt: number;
};

async function ownerRpc<T>(
  action: string,
  args: Record<string, unknown> = {}
): Promise<T> {
  const response = await fetch("/api/owner/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, args })
  });
  const json = (await response.json()) as { error?: string } & T;
  if (!response.ok) {
    throw new Error(json.error ?? "Owner action failed");
  }
  return json;
}

export function OwnerDashboard() {
  const [session, setSession] = useState<"loading" | "in" | "out">("loading");
  const threads = useQuery(
    api.threads.list,
    session === "in" ? { includeArchived: true } : "skip"
  ) as Thread[] | undefined;
  const [selectedId, setSelectedId] = useState<Id<"threads"> | null>(null);
  const selectedThread = useMemo(
    () => threads?.find((thread) => thread._id === selectedId) ?? threads?.[0] ?? null,
    [selectedId, threads]
  );
  const messages = useQuery(
    api.messages.list,
    session === "in" && selectedThread ? { threadId: selectedThread._id } : "skip"
  ) as Message[] | undefined;

  useEffect(() => {
    void fetch("/api/owner/session")
      .then((response) => response.json())
      .then((json: { isOwner?: boolean }) => setSession(json.isOwner ? "in" : "out"))
      .catch(() => setSession("out"));
  }, []);

  if (session === "loading") {
    return <OwnerLoading />;
  }

  if (session === "out") {
    return <OwnerLogin onSuccess={() => setSession("in")} />;
  }

  return (
    <main className="min-h-screen md:grid md:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 pb-5 pt-5">
          <Link href="/" className="min-w-0">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              className="h-8 w-8 px-0"
              aria-label="log out"
              onClick={() => {
                void fetch("/api/owner/logout", { method: "POST" }).then(() =>
                  setSession("out")
                );
              }}
            >
              <LogOut size={14} />
            </Button>
          </div>
        </div>
        <div className="pt-4">
          <CreateThreadForm
            onCreated={(id) => {
              setSelectedId(id);
            }}
          />
        </div>
        <div className="mnwhl-scrollbar max-h-[42vh] overflow-y-auto border-t border-border px-4 py-4 md:max-h-none">
          <p className="mb-3 font-mono text-[11px] uppercase text-faint">threads</p>
          <div className="space-y-2">
            {threads?.map((thread) => (
              <button
                key={thread._id}
                className={`w-full border px-3 py-3 text-left transition hover:-translate-y-0.5 hover:translate-x-0.5 ${
                  selectedThread?._id === thread._id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border"
                }`}
                onClick={() => setSelectedId(thread._id)}
              >
                <span className="block truncate text-sm lowercase">{thread.title}</span>
                <span className="mt-1 block font-mono text-[10px] opacity-70">
                  {thread.messageCount} updates / {thread.heartCount} hearts
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>
      <section className="min-w-0 px-5 py-8 md:px-10 lg:px-14">
        {selectedThread ? (
          <div className="mx-auto grid max-w-6xl gap-10 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              <OwnerHeader thread={selectedThread} />
              <OwnerComposer threadId={selectedThread._id} />
              <OwnerMessageList messages={messages} />
            </div>
            <ThreadEditor key={selectedThread._id} thread={selectedThread} />
          </div>
        ) : (
          <div className="mx-auto max-w-xl py-24">
            <h1 className="text-3xl font-medium lowercase">start a thread</h1>
            <p className="mt-4 text-sm leading-6 text-muted">
              the private terminal is empty. create the first ongoing thing.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

function OwnerLoading() {
  return (
    <main className="grid min-h-screen place-items-center">
      <div className="h-7 w-40 animate-pulse bg-border" />
    </main>
  );
}

function OwnerLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Login failed");
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm border border-border p-8">
        <Logo className="mb-8" />
        <h1 className="text-xl font-medium lowercase">owner login</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          private terminal for publishing ongoing thoughts.
        </p>
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="password"
          className="mt-6"
          autoFocus
          required
        />
        <Button
          type="submit"
          variant="solid"
          className="mt-3 w-full"
          disabled={busy || password.length === 0}
        >
          enter
        </Button>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </form>
    </main>
  );
}

function CreateThreadForm({ onCreated }: { onCreated: (id: Id<"threads">) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "n" && event.metaKey) {
        event.preventDefault();
        titleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { id } = await ownerRpc<{ id: Id<"threads"> }>("createThread", {
        title,
        description: description || undefined,
        status: "active"
      });
      setTitle("");
      setDescription("");
      onCreated(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create thread");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 px-4 pb-4">
      <p className="font-mono text-[11px] uppercase text-faint">new thread</p>
      <Input
        ref={titleRef}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="what is ongoing"
        maxLength={120}
        required
      />
      <Input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="optional context"
        maxLength={500}
      />
      <Button type="submit" variant="solid" disabled={busy || title.trim().length === 0}>
        <Plus size={14} />
        create
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </form>
  );
}

function OwnerHeader({ thread }: { thread: Thread }) {
  return (
    <header className="border-b border-border pb-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={thread.status} />
        <a
          href={`/t/${thread.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 font-mono text-[11px] uppercase text-faint hover:text-foreground"
        >
          public view <ArrowUpRight size={12} />
        </a>
      </div>
      <h1 className="mt-5 text-4xl font-medium lowercase md:text-5xl">{thread.title}</h1>
      <p className="mt-3 font-mono text-[11px] uppercase text-faint">
        {thread.messageCount} updates / {thread.heartCount} hearts
      </p>
    </header>
  );
}

function OwnerComposer({ threadId }: { threadId: Id<"threads"> }) {
  const [content, setContent] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function uploadImage() {
    if (!file) {
      return undefined;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      throw new Error("Only jpeg, png, webp, and gif images are allowed");
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new Error("Images must be 8 MB or smaller");
    }

    const { uploadUrl } = await ownerRpc<{ uploadUrl: string }>("uploadUrl");
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file
    });
    if (!result.ok) {
      throw new Error("Image upload failed");
    }
    const json = (await result.json()) as { storageId: Id<"_storage"> };
    return json.storageId;
  }

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const imageStorageId = await uploadImage();
      await ownerRpc("postMessage", {
        threadId,
        content,
        linkUrl: linkUrl || undefined,
        imageStorageId,
        filename: file?.name
      });
      setContent("");
      setLinkUrl("");
      setFile(null);
      if (textareaRef.current) {
        textareaRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="sticky bottom-0 z-10 border-b border-border bg-[var(--composer)] py-5 backdrop-blur">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="space-y-3"
      >
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
          placeholder="write the next timestamped thing"
          maxLength={4000}
          required
        />
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
          <label className="relative block">
            <LinkIcon
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <Input
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="optional link"
              className="pl-9"
            />
          </label>
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 border border-border px-3 text-sm lowercase transition hover:border-foreground">
            <ImageIcon size={14} />
            {file ? "image selected" : "image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <Button type="submit" variant="solid" disabled={busy || content.trim().length === 0}>
            <Send size={14} />
            publish
          </Button>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>
    </section>
  );
}

function OwnerMessageList({ messages }: { messages: Message[] | undefined }) {
  if (!messages) {
    return (
      <div className="space-y-4 py-8">
        <div className="h-4 w-1/3 animate-pulse bg-border" />
        <div className="h-4 w-3/4 animate-pulse bg-border" />
      </div>
    );
  }

  return (
    <ol className="space-y-7 py-8">
      {messages.map((message) => (
        <li key={message._id} className="border-l border-border pl-4">
          <div className="mb-2 flex items-center justify-between gap-4">
            <time className="font-mono text-[11px] uppercase text-faint">
              {formatShortTime(message.createdAt)}
            </time>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-faint">
                <ArrowUpRight size={12} /> {message.upvoteCount}
              </span>
              <Button
                className="h-7 w-7 px-0"
                variant="danger"
                aria-label="delete message"
                onClick={() => {
                  if (confirm("delete this update?")) {
                    void ownerRpc("deleteMessage", { messageId: message._id });
                  }
                }}
              >
                <Trash2 size={13} />
              </Button>
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>
          {message.linkUrl ? (
            <a
              href={message.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex border-b border-border text-sm text-muted hover:border-foreground hover:text-foreground"
            >
              {message.linkUrl}
            </a>
          ) : null}
          {message.imageUrl ? (
            <Image
              src={message.imageUrl}
              alt=""
              width={700}
              height={440}
              unoptimized
              className="mt-4 h-auto w-full max-w-xl border border-border grayscale"
            />
          ) : null}
        </li>
      ))}
      {messages.length === 0 ? (
        <li className="text-sm text-muted">no published updates in this thread.</li>
      ) : null}
    </ol>
  );
}

function ThreadEditor({ thread }: { thread: Thread }) {
  const [title, setTitle] = useState(thread.title);
  const [description, setDescription] = useState(thread.description ?? "");
  const [status, setStatus] = useState<ThreadStatus>(thread.status);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setError(null);
    setSaved(false);
    try {
      await ownerRpc("updateThread", {
        threadId: thread._id,
        title,
        description: description || undefined,
        status
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save thread");
    }
  }

  return (
    <aside className="h-fit border border-border p-4 xl:sticky xl:top-8">
      <p className="mb-4 font-mono text-[11px] uppercase text-faint">thread controls</p>
      <div className="space-y-3">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="description"
          className="min-h-24"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ThreadStatus)}
          className="h-10 w-full border border-border bg-background px-3 text-sm lowercase text-foreground focus:border-foreground focus:outline-none"
        >
          {THREAD_STATUSES.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <Button variant="solid" onClick={() => void save()}>
            <Save size={14} />
            save
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("delete this thread and all of its updates?")) {
                void ownerRpc("deleteThread", { threadId: thread._id });
              }
            }}
          >
            <Trash2 size={14} />
            delete
          </Button>
        </div>
        {saved ? <p className="text-xs text-muted">saved.</p> : null}
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </div>
    </aside>
  );
}
