import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Community Events — Religious & Community Events Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #064e3b 0%, #059669 55%, #34d399 100%)",
          color: "#ffffff",
          padding: "80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              background: "rgba(255,255,255,0.15)",
              border: "3px solid rgba(255,255,255,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
            }}
          >
            🌙
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>
              Community Events
            </div>
            <div style={{ fontSize: 22, opacity: 0.85 }}>Pakistan · Worldwide</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 62,
            fontWeight: 800,
            letterSpacing: -2,
            lineHeight: 1.1,
            maxWidth: 980,
          }}
        >
          Majlis · Milad · Mehfil-e-Naat · Dars · Urs
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            opacity: 0.9,
            maxWidth: 900,
          }}
        >
          Discover and share religious &amp; community events near you
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 22,
            opacity: 0.75,
          }}
        >
          communityevents.pk
        </div>
      </div>
    ),
    { ...size }
  );
}
