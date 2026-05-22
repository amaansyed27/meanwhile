import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex border border-border bg-[#fbfaf6] p-1 transition hover:-translate-y-0.5 hover:translate-x-0.5 dark:border-border",
        className
      )}
      aria-label="mnwhl"
    >
      <Image
        src="/mnwhl-main-cropped.png"
        alt="mnwhl"
        width={850}
        height={420}
        priority
        className="h-auto w-40 object-contain md:w-44"
      />
    </span>
  );
}
