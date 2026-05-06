import { ImageResponse } from "next/og";

import { defaultDescription, siteName, studioName } from "./seo";

export const alt = `${siteName} by ${studioName}`;
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "linear-gradient(135deg, #f8f7f5 0%, #eef2ff 100%)",
          color: "#1a1a1a",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -190,
            right: -110,
            width: 520,
            height: 520,
            borderRadius: 520,
            background: "rgba(230, 57, 70, 0.22)"
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            left: -140,
            width: 590,
            height: 590,
            borderRadius: 590,
            background: "rgba(99, 102, 241, 0.2)"
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 76,
            right: 86,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 34,
            background: "#1a1a1a",
            color: "#ffffff",
            fontSize: 48,
            fontWeight: 800
          }}
        >
          PF
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            padding: "74px 88px"
          }}
        >
          <div
            style={{
              display: "flex",
              marginBottom: 38,
              color: "#e63946",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 1.8
            }}
          >
            shiftbloom.studio
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 840,
              fontSize: 86,
              fontWeight: 850,
              letterSpacing: -3,
              lineHeight: 0.98
            }}
          >
            OpenAI Privacy Filter Sandbox
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 800,
              marginTop: 30,
              color: "#4b5563",
              fontSize: 34,
              lineHeight: 1.35
            }}
          >
            {defaultDescription}
          </div>
        </div>
      </div>
    ),
    size
  );
}
