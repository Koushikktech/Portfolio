"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import CustomCursor from "@/components/CustomCursor";

export default function LabPage() {
  return (
    <>
      <CustomCursor />

      {/* Navbar wrapper — force light text on dark page */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          pointerEvents: "none",
          // Force nav links to use light (white) text on this dark-themed page
          // by setting --scroll-progress to 1 (fully scrolled = dark bg = light text)
          ["--scroll-progress" as string]: 1,
        } as React.CSSProperties}
      >
        <div style={{ pointerEvents: "auto" }}>
          <Navbar />
        </div>
      </div>

      <div
        className="subpage-root"
        style={{
          background: "#09090b",
          minHeight: "100vh",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "0 24px",
          }}
        >
          {/* Top label */}
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "10px",
              fontWeight: 650,
              letterSpacing: "0.2em",
              color: "#bfff00",
              textTransform: "uppercase",
              marginBottom: "24px",
            }}
          >
            CREATIVE EXPERIMENTS & SHADERS
          </motion.span>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: "clamp(2.5rem, 8vw, 6rem)",
              fontWeight: 850,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              marginBottom: "24px",
              color: "#ffffff",
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            LAB
          </motion.h1>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "60px",
              height: "1px",
              background: "rgba(191, 255, 0, 0.4)",
              marginBottom: "28px",
              transformOrigin: "center",
            }}
          />

          {/* Coming Soon badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              border: "1px solid rgba(191, 255, 0, 0.15)",
              borderRadius: "100px",
              background: "rgba(191, 255, 0, 0.04)",
              marginBottom: "28px",
            }}
          >
            <span
              className="coming-soon-pulse"
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#bfff00",
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.7)",
                textTransform: "uppercase",
              }}
            >
              COMING SOON
            </span>
          </motion.div>

          {/* Description */}
        </div>
      </div>
    </>
  );
}
