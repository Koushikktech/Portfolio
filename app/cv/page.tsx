"use client";

import Navbar from "@/components/Navbar";

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

const SKILL_CATEGORIES = [
  {
    category: "Languages",
    items: ["TypeScript", "JavaScript (ESNext)", "Python", "C++", "SQL", "HTML5/CSS3"],
  },
  {
    category: "Frameworks & Libraries",
    items: ["Next.js (App Router)", "React", "Node.js", "Express", "Tailwind CSS", "Three.js / React Three Fiber"],
  },
  {
    category: "Databases & Cloud",
    items: ["PostgreSQL", "Supabase", "Redis", "Firebase", "AWS (EC2, S3)", "Docker"],
  },
  {
    category: "AI & Engineering Tools",
    items: ["LangGraph", "LangChain", "Amazon Nova", "Git/GitHub", "Vercel", "Turbopack"],
  },
];

export default function CVPage() {
  return (
    <>
      {/* Navbar wrapper */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          pointerEvents: "none",
          ["--scroll-progress" as string]: 1,
        } as React.CSSProperties}
      >
        <div style={{ pointerEvents: "auto" }}>
          <Navbar />
        </div>
      </div>

      <div className="subpage-root cv-container">
        {/* Header */}
        <header className="cv-header">
          <div className="cv-header-left">
            <div className="craft-title-wrap">
              <h1 className="cv-title">CURRICULUM VITAE</h1>
            </div>
            <p className="cv-subtitle-meta">
              <span>WORK EXPERIENCE & ACADEMIC BACKGROUND</span>
              <span className="craft-sep">{"//"}</span>
              <span>2024 — 2026</span>
            </p>
          </div>

          <a 
            href="/cv.pdf" 
            download
            className="cv-download-btn"
            aria-label="Download Curriculum Vitae in PDF format"
          >
            <span>DOWNLOAD PDF CV</span>
            <span className="arrow">↓</span>
          </a>
        </header>

        {/* Work experience section */}
        <section className="cv-section">
          <h2 className="cv-section-title">
            PROFESSIONAL EXPERIENCE {"//"}
          </h2>

          <div className="cv-list">
            {EXPERIENCES.map((exp, idx) => (
              <div key={idx} className="cv-entry-grid">
                <div className="cv-entry-meta">
                  <h3 className="cv-role">{exp.role}</h3>
                  <span className="cv-company">{exp.company}</span>
                  <span className="cv-period">{exp.period}</span>
                </div>
                <ul className="cv-points">
                  {exp.points.map((pt, pIdx) => (
                    <li key={pIdx} className="cv-point-item">
                      <span className="cv-bullet">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Education section */}
        <section className="cv-section">
          <h2 className="cv-section-title">
            EDUCATION & CERTIFICATIONS {"//"}
          </h2>

          <div className="cv-list">
            <div className="cv-entry-grid">
              <div className="cv-entry-meta">
                <h3 className="cv-role">Bachelor of Technology</h3>
                <span className="cv-company">Computer Science & Engineering</span>
                <span className="cv-period">2022 — 2026</span>
              </div>
              <div className="cv-points">
                <p className="cv-point-item" style={{ listStyle: "none" }}>
                  Focused on distributed systems, database management, artificial intelligence, and web technologies. Maintained top-tier academic grades.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Competencies & Skills section */}
        <section className="cv-section">
          <h2 className="cv-section-title">
            CORE COMPETENCIES & EXPERTISE {"//"}
          </h2>

          <div className="cv-skills-grid">
            {SKILL_CATEGORIES.map((cat, idx) => (
              <div key={idx} className="cv-skill-category">
                <h3 className="cv-skill-cat-title">{cat.category}</h3>
                <div className="cv-skill-pill-list">
                  {cat.items.map((item, iIdx) => (
                    <span key={iIdx} className="cv-skill-pill">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
