import { ImageResponse } from "next/og";
import { ANGEL_PATH } from "@/lib/angel-path";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 601 601"><path fill="#FEC734" fill-rule="evenodd" d="${ANGEL_PATH}"/></svg>`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10 }}>
        { }
        <img width={42} height={42} src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`} alt="" />
      </div>
    ),
    size,
  );
}
