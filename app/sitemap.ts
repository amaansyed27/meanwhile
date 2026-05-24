import type { MetadataRoute } from "next";
import { getPublicThreads } from "@/lib/server/public-content";
import { getAppUrl, isOwnerSurface } from "@/lib/site";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();

  if (isOwnerSurface()) {
    return [];
  }

  const threads = await getPublicThreads();

  return [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1
    },
    ...threads.map((thread) => ({
      url: `${appUrl}/t/${thread.slug}`,
      lastModified: new Date(thread.lastMessageAt ?? thread.updatedAt),
      changeFrequency: "weekly" as const,
      priority: thread.status === "archived" ? 0.45 : 0.8
    }))
  ];
}
