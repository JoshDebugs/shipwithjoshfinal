import { ImageResponse } from "next/og";

export const alt = "Joshmann Singh — Builder out of Chandigarh.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 72px",
          color: "#f5f5f5",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* top bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
            color: "#a3a3a3",
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            shipwithjosh<span style={{ color: "#c5ff3d" }}>.</span>com
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#c5ff3d",
              }}
            />
            <span>open to roles. picky about them.</span>
          </div>
        </div>

        {/* center */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "#5a5a5a",
              textTransform: "uppercase",
              letterSpacing: "0.25em",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#c5ff3d",
              }}
            />
            currently shipping LazyBull
          </div>
          <div
            style={{
              fontSize: 140,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              color: "#f5f5f5",
              display: "flex",
            }}
          >
            Joshmann Singh
            <span style={{ color: "#c5ff3d" }}>.</span>
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#a3a3a3",
              display: "flex",
              flexDirection: "column",
              marginTop: 24,
              lineHeight: 1.3,
            }}
          >
            <span>Builder out of Chandigarh.</span>
            <span>I ship fast and have taste.</span>
          </div>
        </div>

        {/* bottom stats */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 18,
            color: "#a3a3a3",
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#5a5a5a" }}>03</span>
            <span>startups shipped</span>
          </div>
          <span style={{ color: "#1f1f1f" }}>/</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#5a5a5a" }}>00</span>
            <span>vc raised</span>
          </div>
          <span style={{ color: "#1f1f1f" }}>/</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ color: "#5a5a5a" }}>18</span>
            <span>years old</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
