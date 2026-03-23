"use client";
import { ChevronUp, ChevronDown } from "lucide-react";

export default function ScrollControls() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 30,
      }}
    >
      <button
        onClick={scrollToTop}
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "var(--bg)",
          color: "var(--text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
        }}
      >
        <ChevronUp size={20} />
      </button>
      <button
        onClick={scrollToBottom}
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "50%",
          border: "1px solid var(--border)",
          background: "var(--bg)",
          color: "var(--text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
        }}
      >
        <ChevronDown size={20} />
      </button>
    </div>
  );
}
