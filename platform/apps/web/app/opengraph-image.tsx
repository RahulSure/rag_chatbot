import { ImageResponse } from "next/og";

export const alt = "Sadhak.ai — Your AI spiritual companion";
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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #faf6ee 0%, #f3e3c6 100%)",
          color: "#231a12",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>
          Sadhak<span style={{ color: "#9a5408" }}>.ai</span>
        </div>
        <div style={{ fontSize: 40, marginTop: 20, color: "#4e4136" }}>Your AI spiritual companion</div>
        <div style={{ fontSize: 28, marginTop: 36, color: "#6e5f51" }}>
          Mantra · Meditation · Sadhana — answers with sources
        </div>
      </div>
    ),
    size
  );
}
