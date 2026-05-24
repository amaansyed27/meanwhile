import type { Metadata } from "next";
import { ReaderApp } from "@/components/app/reader-app";
import {
  getPublicThreadPageData,
  getPublicThreads,
  getThreadDescription
} from "@/lib/server/public-content";
import { getAppUrl, siteName } from "@/lib/site";
import { notFound } from "next/navigation";

type ThreadPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export async function generateMetadata({
  params
}: ThreadPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicThreadPageData(slug);

  if (!data) {
    return {
      title: "thread not found",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const description = getThreadDescription(data.thread, data.messages);
  const url = `${getAppUrl()}/t/${data.thread.slug}`;
  const imageUrl = `/t/${data.thread.slug}/opengraph-image`;

  return {
    title: data.thread.title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title: `${data.thread.title} / ${siteName}`,
      description,
      url,
      type: "article",
      publishedTime: new Date(data.thread.createdAt).toISOString(),
      modifiedTime: new Date(
        data.thread.lastMessageAt ?? data.thread.updatedAt
      ).toISOString(),
      authors: [data.thread.ownerName ?? siteName],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${data.thread.title} on ${siteName}`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.thread.title} / ${siteName}`,
      description,
      images: [imageUrl]
    }
  };
}

export async function generateStaticParams() {
  const threads = await getPublicThreads();
  return threads.slice(0, 100).map((thread) => ({ slug: thread.slug }));
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const { slug } = await params;
  const data = await getPublicThreadPageData(slug);

  if (!data) {
    notFound();
  }

  const url = `${getAppUrl()}/t/${data.thread.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    name: data.thread.title,
    description: getThreadDescription(data.thread, data.messages),
    url,
    dateCreated: new Date(data.thread.createdAt).toISOString(),
    dateModified: new Date(
      data.thread.lastMessageAt ?? data.thread.updatedAt
    ).toISOString(),
    author: {
      "@type": "Person",
      name: data.thread.ownerName ?? siteName
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: data.thread.heartCount
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WriteAction",
        userInteractionCount: data.thread.messageCount
      }
    ],
    hasPart: data.messages.slice(-25).map((message) => ({
      "@type": "SocialMediaPosting",
      text: message.content,
      datePublished: new Date(message.createdAt).toISOString(),
      url: `${url}#message-${message._id}`
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
        }}
      />
      <ReaderApp
        initialSlug={slug}
        initialThreads={await getPublicThreads()}
        initialThread={data.thread}
        initialMessages={data.messages}
      />
    </>
  );
}
