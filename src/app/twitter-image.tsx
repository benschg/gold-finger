import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Gold Finger - Expense Tracking";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Gold finger icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ffd700 0%, #ffb347 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 60px rgba(255, 215, 0, 0.4)",
            }}
          >
            <svg
              width="70"
              height="70"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1a1a2e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            background: "linear-gradient(90deg, #ffd700, #ffb347)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 20,
            letterSpacing: "-0.02em",
          }}
        >
          Gold Finger
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: "#a0aec0",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Simple, beautiful expense tracking
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 40,
            marginTop: 50,
          }}
        >
          {["Track Expenses", "Share Accounts", "Scan Receipts"].map(
            (feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#e2e8f0",
                  fontSize: 20,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#ffd700",
                  }}
                />
                {feature}
              </div>
            )
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
