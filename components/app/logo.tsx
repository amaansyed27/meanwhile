import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "group inline-flex items-center gap-3 text-foreground",
        className
      )}
      aria-label="mnwhl"
    >
      <span className="grid h-9 w-9 place-items-center border border-foreground bg-foreground text-background transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
        <span className="font-mono text-[13px] leading-none">m</span>
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-semibold lowercase leading-none tracking-normal">
          mnwhl
        </span>
        <span className="mt-1 block font-mono text-[10px] uppercase leading-none text-faint">
          ongoing things
        </span>
      </span>
    </span>
  );
}
