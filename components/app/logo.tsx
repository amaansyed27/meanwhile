import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex border border-border bg-[#fbfaf6] p-1 text-[#11110f] transition hover:-translate-y-0.5 hover:translate-x-0.5 dark:border-border",
        className
      )}
      aria-label="mnwhl"
    >
      <svg
        viewBox="0 0 850 420"
        role="img"
        aria-hidden="true"
        className="h-auto w-40 md:w-44"
      >
        <rect width="850" height="420" fill="#fbfaf6" />
        <g
          fill="currentColor"
          fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
          fontSize="144"
          fontWeight="680"
        >
          <text x="86" y="220">m</text>
          <text x="244" y="220">n</text>
          <text x="368" y="220">w</text>
          <text x="532" y="220">h</text>
          <text x="664" y="220">l</text>
        </g>
        <rect
          className="mnwhl-logo-cursor"
          x="726"
          y="68"
          width="7"
          height="190"
          fill="currentColor"
        />
        <circle cx="292" cy="332" r="10" fill="currentColor" />
        <circle cx="364" cy="332" r="9" fill="#73736e" />
        <circle cx="420" cy="332" r="9" fill="#73736e" />
        <circle cx="476" cy="332" r="9" fill="#8c8c86" />
      </svg>
    </span>
  );
}
