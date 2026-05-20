import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/mnwhl-main.png"
      alt="mnwhl"
      width={158}
      height={56}
      priority
      className={cn("h-auto w-24 dark:invert", className)}
    />
  );
}
