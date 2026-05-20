import { cn } from "@/lib/utils";
import { statusTone, type ThreadStatus } from "@/lib/status";

export function StatusBadge({ status }: { status: ThreadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center border px-2 font-mono text-[11px] lowercase leading-none",
        statusTone(status)
      )}
    >
      {status}
    </span>
  );
}
