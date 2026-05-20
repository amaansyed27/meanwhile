export const THREAD_STATUSES = [
  "active",
  "paused",
  "abandoned",
  "shipped",
  "obsessed",
  "archived"
] as const;

export type ThreadStatus = (typeof THREAD_STATUSES)[number];

export function statusTone(status: ThreadStatus) {
  switch (status) {
    case "active":
      return "border-foreground text-foreground";
    case "obsessed":
      return "border-foreground bg-foreground text-background";
    case "shipped":
      return "border-muted text-foreground";
    case "paused":
      return "border-faint text-muted";
    case "abandoned":
      return "border-danger text-danger";
    case "archived":
      return "border-border text-faint";
  }
}
