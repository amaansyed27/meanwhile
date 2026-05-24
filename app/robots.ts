import type { MetadataRoute } from "next";
import { getAppUrl, isOwnerSurface } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();

  if (isOwnerSurface()) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/"
      },
      host: appUrl
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/owner"]
      }
    ],
    sitemap: `${appUrl}/sitemap.xml`,
    host: appUrl
  };
}
