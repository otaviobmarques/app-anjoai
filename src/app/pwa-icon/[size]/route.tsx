import { ImageResponse } from "next/og";
import { ANGEL_PATH } from "@/lib/angel-path";

const SIZES: Record<string, { px: number; pad: number }> = {
  "192": { px: 192, pad: 0.1 },
  "512": { px: 512, pad: 0.1 },
  "maskable-512": { px: 512, pad: 0.2 },
  "apple-180": { px: 180, pad: 0.12 },
};

export const dynamic = "force-static";
export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const s = SIZES[size] ?? SIZES["192"];
  const inner = Math.round(s.px * (1 - 2 * s.pad));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 601 601"><path fill="#FEC734" fill-rule="evenodd" d="${ANGEL_PATH}"/></svg>`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={inner} height={inner} src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} alt="" />
      </div>
    ),
    { width: s.px, height: s.px },
  );
}
