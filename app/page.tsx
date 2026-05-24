import { ReaderApp } from "@/components/app/reader-app";
import { getPublicThreadPageData, getPublicThreads } from "@/lib/server/public-content";
import { getAppUrl, publicSiteDescription, siteName } from "@/lib/site";
import { redirect } from "next/navigation";

export default async function HomePage() {
  if (process.env.MNWHL_SURFACE === "owner") {
    redirect("/owner");
  }

  const threads = await getPublicThreads();
  const firstThread = threads[0];
  const firstThreadData = firstThread
    ? await getPublicThreadPageData(firstThread.slug)
    : null;
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: getAppUrl(),
    description: publicSiteDescription
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c")
        }}
      />
      <ReaderApp
        initialThreads={threads}
        initialThread={firstThreadData?.thread ?? null}
        initialMessages={firstThreadData?.messages}
      />
    </>
  );
}
