"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          margin: 0,
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <p
              style={{
                fontSize: "3rem",
                fontWeight: 900,
                fontFamily: "monospace",
                color: "#ef4444",
                margin: "0 0 0.5rem",
              }}
            >
              Fatal Error
            </p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.75rem" }}>
              Application failed to load
            </h1>
            <p style={{ color: "#a1a1aa", fontSize: "0.875rem", margin: "0 0 1.5rem" }}>
              {error.message || "A critical error occurred. Please refresh the page."}
            </p>
            <button
              onClick={reset}
              style={{
                background: "#ff5e1f",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
