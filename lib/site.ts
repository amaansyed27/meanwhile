export const siteName = "mnwhl";
export const publicSiteDescription = "a quiet place for ongoing things.";
export const ownerSiteDescription = "private terminal for publishing ongoing things.";

export function getAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function isOwnerSurface() {
  return process.env.MNWHL_SURFACE === "owner";
}

export function getSiteDescription() {
  return isOwnerSurface() ? ownerSiteDescription : publicSiteDescription;
}
