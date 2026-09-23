"use client";

import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

interface ProjectItem {
  id: string;
  title: string;
  category: string;
  year: string;
  tech: string[];
  description: string;
  keyHighlights: string[];
  video?: string;
  url: string;
  githubUrl?: string;
  isLive: boolean;
}

const CRAFT_PROJECTS: ProjectItem[] = [
  {
    id: "01",
    title: "Kavacha",
    category: "Linux Kernel Defense & Autonomous SOC",
    year: "2026",
    tech: ["Linux Kernel", "nftables", "Python", "FastAPI", "SQLite SHA-256", "Next.js"],
    description:
      "Autonomous host defense and human-governed containment toolkit for edge Linux workloads. Detects behavioral BOLA/IDOR attacks, enforces surgical minimal mitigations live in the Linux kernel via nftables, provides closed-loop verification, auto-reverts on 20s TTL leases, and chains every event into a tamper-evident SHA-256 audit ledger.",
    keyHighlights: [
      "Behavioral BOLA detection evaluating object fan-out and cross-owner access",
      "Live Linux kernel rule enforcement with human-in-the-loop safety gate",
      "Tamper-evident SHA-256 hash-chained SQLite audit ledger",
      "Autonomous 20-second lease auto-rollback preventing persistent outages",
    ],
    url: "https://github.com/Koushikktech/Kavacha",
    githubUrl: "https://github.com/Koushikktech/Kavacha",
    isLive: false,
  },
  {
    id: "02",
    title: "HealthGrid",
    category: "Clinical Synthetic Cohort Platform",
    year: "2026",
    tech: ["React 19", "TypeScript", "Tailwind CSS", "Recharts", "Causal SCMs", "Vite"],
    description:
      "Clinical research platform generating privacy-certified synthetic patient cohorts from sparse clinical datasets. Steers target populations using Structural Causal Models (SCMs) vs. Gaussian Copula baselines, validates fidelity via KS & Wasserstein divergence, and certifies datasets with SHA-256 Cohort Passports.",
    keyHighlights: [
      "Causal steering propagating covariate shifts through Structural Causal Models",
      "Honesty Extrapolation Meter scoring divergence from observed sample density",
      "ESORICS 2025 relative DCR (rDCR) empirical shadow-model MIA privacy suite",
      "Tamper-evident SHA-256 hash-linked Cohort Passport certification",
    ],
    url: "https://health-grid-smoky.vercel.app",
    githubUrl: "https://github.com/Koushikktech/HealthGrid",
    isLive: true,
  },
  {
    id: "03",
    title: "NovaSecurity",
    category: "Agentic Vulnerability Analysis & AST Taint Graph",
    year: "2026",
    tech: ["Python", "FastAPI", "Tree-sitter", "NetworkX", "LangGraph", "Amazon Nova"],
    description:
      "Agentic vulnerability analysis and taint flow engine. Performs AST parsing with Tree-sitter, directed graph taint flow analysis with NetworkX, multi-agent reasoning with LangGraph and Amazon Nova, and automated patch synthesis with semantic AST diff validation.",
    keyHighlights: [
      "Source-to-sink taint analysis with Tree-sitter AST and NetworkX directed graphs",
      "LangGraph stateful multi-agent DAG execution using Amazon Nova",
      "Automated production patch generation with semantic diff validation",
      "Zero-latency streaming UI with real-time audit progress trees",
    ],
    video: "/projects/project2.mp4",
    url: "https://github.com/Koushikktech/NovaSecurity-Backend",
    githubUrl: "https://github.com/Koushikktech/NovaSecurity-Backend",
    isLive: false,
  },
  {
    id: "04",
    title: "Creatorly",
    category: "AI Digital Space & Commerce Platform",
    year: "2026 — Ongoing",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Stripe Connect"],
    description:
      "An AI-augmented digital space and commerce ecosystem for creators unifying bio-links, digital product storefronts, audience funnels, dynamic component hydration, and instant Stripe Connect checkout workflows under a synchronized dashboard.",
    keyHighlights: [
      "Real-time analytics engine tracking creator conversion funnels",
      "Dynamic component hydration with sub-100ms cold start latency",
      "Stripe Connect integrated instant checkout workflows",
      "Custom domain mapping with edge-cached profile routing",
    ],
    video: "/projects/project1.mp4",
    url: "https://creatorly.space/",
    isLive: true,
  },
  {
    id: "05",
    title: "OtakuDynamics",
    category: "Anime Discovery & Watchlist Engine",
    year: "2024",
    tech: ["React.js", "Firebase Firestore", "Tailwind CSS", "Jikan REST API"],
    description:
      "High-performance anime discovery and tracking platform engineered with instant client-side state caching, real-time synchronized watchlists powered by Firebase Firestore, and faceted filtering across 20,000+ indexed titles.",
    keyHighlights: [
      "Optimistic UI updates with instant client-side state caching",
      "Real-time synchronized watchlists powered by Firebase Firestore",
      "Faceted filter matrix across genres, studios, and air dates",
      "Automated schedule notifications for active airing seasons",
    ],
    video: "/projects/project3.mp4",
    url: "https://otaku-dynamics.vercel.app/",
    githubUrl: "https://github.com/Koushikktech/OtakuDynamics",
    isLive: true,
  },
  {
    id: "06",
    title: "QueueSync",
    category: "Smart Queue & Wait-Time Optimization",
    year: "2025",
    tech: ["Next.js", "TypeScript", "Python ML", "Tailwind CSS", "REST API"],
    description:
      "Predictive queue orchestration platform designed to eliminate waiting room bottlenecks. Integrates a Next.js administrative dashboard with a Python ML regression model that forecasts customer wait times and reallocates desk capacity dynamically.",
    keyHighlights: [
      "Live predictive queue wait-time estimation model",
      "Multi-counter service load balancing and dispatch",
      "Responsive customer ticketing interface with real-time status updates",
      "Historical throughput analytics and peak load reporting",
    ],
    url: "https://algorithm-avengers.vercel.app",
    githubUrl: "https://github.com/Koushikktech/QueueSync",
    isLive: true,
  },
];

export default function CraftPage() {
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

      <div className="subpage-root craft-page-root">
        {/* Page Header */}
        <header className="cv-header">
          <div className="cv-header-left">
            <div className="craft-title-wrap">
              <h1 className="cv-title">CRAFT</h1>
            </div>
            <p className="cv-subtitle-meta">
              <span>SELECTED WORKS & PRODUCTION SYSTEMS</span>
              <span className="craft-sep">{"//"}</span>
              <span>2024 — 2026</span>
            </p>
          </div>
          <div className="craft-filter-badge">
            <span>6 PRODUCTION RELEASES</span>
          </div>
        </header>

        {/* Projects Showcase Grid */}
        <div className="craft-showcase-grid">
          {CRAFT_PROJECTS.map((item, idx) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.12 + idx * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="craft-showcase-card"
            >
              {/* Media Container — only rendered if an authentic video exists */}
              {item.video && (
                <div className="craft-card-media-wrap">
                  <video
                    src={item.video}
                    loop
                    muted
                    autoPlay
                    playsInline
                    preload="metadata"
                    className="craft-card-media"
                  />
                  <div className="craft-card-overlay-badge">
                    <span>{item.category}</span>
                  </div>
                </div>
              )}

              {/* Content Body */}
              <div className="craft-card-body">
                {/* For cards without media, show category as top inline badge */}
                {!item.video && (
                  <div style={{ marginBottom: "14px" }}>
                    <span className="craft-category-badge-inline">{item.category}</span>
                  </div>
                )}

                <div className="craft-card-meta-line">
                  <span className="craft-card-id">#{item.id}</span>
                  <span className="craft-sep">{"//"}</span>
                  <span className="craft-card-year">{item.year}</span>
                </div>

                <h2 className="craft-card-title">{item.title}</h2>
                <p className="craft-card-desc">{item.description}</p>

                {/* Technical highlights */}
                <div className="craft-card-highlights">
                  {item.keyHighlights.map((highlight, hIdx) => (
                    <div key={hIdx} className="craft-card-highlight-item">
                      <span className="cv-bullet">•</span>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                {/* Tech Pills */}
                <div className="craft-card-tech-list">
                  {item.tech.map((tech, tIdx) => (
                    <span key={tIdx} className="craft-card-tech-pill">
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Minimal Monochrome Actions */}
                <div className="craft-card-actions">
                  {item.isLive ? (
                    <>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="craft-card-primary-btn"
                        style={{ flex: 1 }}
                      >
                        <span>EXPLORE LIVE</span>
                        <span className="arrow">↗</span>
                      </a>
                      {item.githubUrl && (
                        <a
                          href={item.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="craft-card-secondary-btn"
                          aria-label={`View ${item.title} GitHub repository`}
                        >
                          <span>CODE</span>
                          <span className="arrow">↗</span>
                        </a>
                      )}
                    </>
                  ) : (
                    <a
                      href={item.githubUrl || item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="craft-card-primary-btn"
                      style={{ flex: 1 }}
                    >
                      <span>VIEW REPOSITORY</span>
                      <span className="arrow">↗</span>
                    </a>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </>
  );
}
