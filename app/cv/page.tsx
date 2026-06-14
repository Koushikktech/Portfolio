"use client";

import Navbar from "@/components/Navbar";
import CustomCursor from "@/components/CustomCursor";

interface WorkExperience {
  role: string;
  company: string;
  period: string;
  points: string[];
}

const EXPERIENCES: WorkExperience[] = [
  {
    role: "Full-Stack Software Engineer",
    company: "Nova Labs",
    period: "2025 - Present",
    points: [
      "Designed and deployed a graph-based multi-agent LLM workflow automating security vulnerability detection.",
      "Optimized Next.js static asset rendering pipeline, improving FCP and Core Web Vitals scores by 25%.",
      "Architected real-time WebSocket messaging layer handling thousands of synchronized concurrent requests.",
    ],
  },
  {
    role: "Software Developer Intern",
    company: "PixelCraft",
    period: "2024 (6 Months)",
    points: [
      "Integrated complex third-party authentication protocols and local caching algorithms using Supabase and IndexedDB.",
      "Engineered dynamic UI elements and CSS micro-animations causing a 15% increase in user retention rates.",
    ],
  },
];

export default function CVPage() {
  return (
    <>
      <CustomCursor />
      
      {/* Navbar wrapper */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <Navbar />
        </div>
      </div>

      <div className="subpage-root" style={{ background: "#09090b", minHeight: "100vh", color: "#ffffff", padding: "8vh 10% 6vh 18%" }}>
        {/* Header */}
        <header className="craft-header" style={{ marginBottom: "60px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div className="craft-header-left">
            <div className="craft-title-wrap">
              <h1 className="craft-title" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>CURRICULUM VITAE</h1>
            </div>
            <p className="craft-subtitle-meta" style={{ marginTop: "12px" }}>
              <span>WORK EXPERIENCE & ACADEMIC BACKGROUND</span>
              <span className="craft-sep">//</span>
              <span>2024 — 2026</span>
            </p>
          </div>

          <a 
            href="/cv.pdf" 
            download
            className="project-link" 
            style={{ 
              fontSize: "12px", 
              fontWeight: "650", 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "6px",
              paddingBottom: "4px",
              borderBottom: "1.5px solid #bfff00",
              color: "#bfff00"
            }}
          >
            <span>DOWNLOAD PDF CV</span>
            <span className="arrow">↓</span>
          </a>
        </header>

        {/* Work experience section */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "12px", color: "#bfff00", fontWeight: "650", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
            PROFESSIONAL EXPERIENCE //
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {EXPERIENCES.map((exp, idx) => (
              <div 
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "250px 1fr",
                  gap: "24px"
                }}
              >
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff" }}>{exp.role}</h3>
                  <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", display: "block", marginTop: "4px" }}>
                    {exp.company}
                  </span>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", display: "block", marginTop: "8px", fontFamily: "monospace" }}>
                    {exp.period}
                  </span>
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {exp.points.map((pt, pIdx) => (
                    <li key={pIdx} style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: "1.6", fontWeight: "300" }}>
                      • {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Education section */}
        <section>
          <h2 style={{ fontSize: "12px", color: "#bfff00", fontWeight: "650", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "32px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
            EDUCATION & CERTIFICATIONS //
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "24px" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#ffffff" }}>Bachelor of Technology</h3>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", display: "block", marginTop: "4px" }}>
                  Computer Science & Engineering
                </span>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", display: "block", marginTop: "8px", fontFamily: "monospace" }}>
                  2022 - 2026
                </span>
              </div>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: "1.6", fontWeight: "300" }}>
                Focused on distributed systems, database management, artificial intelligence, and web technologies. Maintained top-tier academic grades.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
