import { ReaderApp } from "@/components/app/reader-app";

export default async function ThreadPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ReaderApp initialSlug={slug} />;
}
