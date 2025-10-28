import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#0f172a",
          borderRadius: 16,
          color: "#f8fafc",
          display: "flex",
          fontSize: 32,
          fontWeight: 600,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "0.06em",
          width: "100%",
        }}
      >
        IA
      </div>
    ),
    {
      ...size,
    }
  );
}
