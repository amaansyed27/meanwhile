import { ImageResponse } from "next/og";
import { getPublicThreadPageData } from "@/lib/server/public-content";
import { siteName } from "@/lib/site";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";
export const alt = "mnwhl thread";

type ImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: ImageProps) {
  const { slug } = await params;
  const data = await getPublicThreadPageData(slug);
  const title = data?.thread.title ?? siteName;
  const status = data?.thread.status ?? "ongoing";
  const updates = data?.thread.messageCount ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f5ef",
          color: "#171716",
          padding: 64,
          fontFamily: "Arial, Helvetica, sans-serif"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 24,
            letterSpacing: 0
          }}
        >
          <div
            style={{
              border: "1px solid #171716",
              padding: "10px 14px",
              fontWeight: 700
            }}
          >
            {status}
          </div>
          <div style={{ color: "#6c6961" }}>{updates} updates</div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24
          }}
        >
          <div
            style={{
              fontSize: 92,
              lineHeight: 0.98,
              fontWeight: 700,
              letterSpacing: 0,
              maxWidth: 980
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, color: "#6c6961" }}>
            a quiet place for ongoing things.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 28,
            fontWeight: 700
          }}
        >
          <span>{siteName}</span>
          <span style={{ width: 4, height: 42, background: "#171716" }} />
        </div>
      </div>
    ),
    size
  );
}
