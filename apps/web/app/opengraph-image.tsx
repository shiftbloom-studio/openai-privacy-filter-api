import { ImageResponse } from "next/og";

import { defaultDescription, siteName, studioName } from "./seo";

export const alt = `${siteName} by ${studioName}`;
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

/* The Bloom, drawn from the brandbook v2.0 construction spec — same rings as
 * components/bloom.tsx, emitted as a data-URI SVG because ImageResponse
 * (satori) renders <img> but not inline <svg>. */
const RINGS = [
  { tipRadius: 100, petals: 10, width: 200 * 0.16, length: 200 * 0.45, root: "#D8163F", tip: "#FF2E52", offset: 0 },
  { tipRadius: 74, petals: 10, width: 148 * 0.17, length: 148 * 0.45, root: "#FF2E52", tip: "#FF7E9E", offset: 18 },
  { tipRadius: 50, petals: 8, width: 100 * 0.19, length: 100 * 0.45, root: "#FF7E9E", tip: "#FFC2D3", offset: 40.5 },
  { tipRadius: 27, petals: 6, width: 54 * 0.24, length: 54 * 0.45, root: "#FFB4CA", tip: "#FFDCE7", offset: 70.5 }
];

const n = (v: number) => Number(v.toFixed(2));

const petalPath = (w: number, l: number) => {
  const c = n(0.55 * l);
  return `M 0,0 C ${n(w)},0 ${n(w)},${-c} 0,${-n(l)} C ${-n(w)},${-c} ${-n(w)},0 0,0 Z`;
};

function bloomSvgDataUri(): string {
  const defs = RINGS.map(
    (ring) =>
      `<linearGradient id="r${ring.tipRadius}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${-n(ring.length)}"><stop offset="0%" stop-color="${ring.root}"/><stop offset="100%" stop-color="${ring.tip}"/></linearGradient>`
  ).join("");

  const petals = RINGS.map((ring) => {
    const d = petalPath(ring.width, ring.length);
    const rootDistance = ring.tipRadius - ring.length;
    return Array.from({ length: ring.petals }, (_, p) => {
      const angle = n(ring.offset + (360 / ring.petals) * p);
      return `<path d="${d}" fill="url(#r${ring.tipRadius})" transform="translate(100 100) rotate(${angle}) translate(0 ${-n(rootDistance)})"/>`;
    }).join("");
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs>${defs}</defs>${petals}<circle cx="100" cy="100" r="7" fill="#FF2E52"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

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
          background: "#ffffff",
          color: "#1A1216",
          fontFamily: "ui-sans-serif, system-ui, sans-serif"
        }}
      >
        {/* The mark owns its corner; type orbits it, never sits on it. */}
        <img
          alt=""
          src={bloomSvgDataUri()}
          style={{ position: "absolute", right: 72, top: 90, width: 300, height: 300 }}
        />
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
              marginBottom: 42,
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: -0.6
            }}
          >
            shiftbloom
            <span style={{ color: "rgba(26, 18, 22, 0.6)", fontWeight: 400, marginLeft: 10 }}>studio</span>
            <span style={{ color: "#FF2E52" }}>.</span>
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 780,
              fontSize: 82,
              fontWeight: 600,
              letterSpacing: -2.4,
              lineHeight: 1.02
            }}
          >
            OpenAI Privacy Filter Sandbox.
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: 720,
              marginTop: 28,
              color: "rgba(26, 18, 22, 0.65)",
              fontSize: 30,
              lineHeight: 1.4
            }}
          >
            {defaultDescription}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 46,
              color: "rgba(26, 18, 22, 0.65)",
              fontFamily: "ui-monospace, monospace",
              fontSize: 20,
              letterSpacing: 2.4,
              textTransform: "uppercase"
            }}
          >
            privacy.shiftbloom.studio · openai/privacy-filter
          </div>
        </div>
      </div>
    ),
    size
  );
}
