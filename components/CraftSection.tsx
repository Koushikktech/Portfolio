"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { DeviceTier } from "@/lib/deviceTier";

interface CraftWindow extends Window {
  __craftImageHovered?: boolean;
}

interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  tech: string[];
  description: string;
  image: string;
  video?: string;
  url: string;
}

const PROJECTS: Project[] = [
  {
    id: "01",
    title: "Creatorly",
    category: "AI Digital Space & Commerce",
    year: "2026 — Ongoing",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Stripe"],
    description:
      "An AI-augmented digital ecosystem for creators unifying bio-links, digital product storefronts, audience funnels, dynamic component hydration, and instant Stripe Connect checkout workflows.",
    image: "/projects/project1.png",
    video: "/projects/project1.mp4",
    url: "https://creatorly.space/",
  },
  {
    id: "02",
    title: "NovaSecurity",
    category: "Agentic Vulnerability Analysis",
    year: "2026",
    tech: ["Python", "FastAPI", "Tree-sitter", "LangGraph", "Amazon Nova"],
    description:
      "Autonomous vulnerability analysis and taint flow engine. Performs AST parsing with Tree-sitter, directed graph taint flow analysis with NetworkX, multi-agent reasoning with LangGraph and Amazon Nova, and automated patch synthesis with semantic AST diff validation.",
    image: "/projects/project2.png",
    video: "/projects/project2.mp4",
    url: "https://github.com/Koushikktech/NovaSecurity-Backend",
  },
  {
    id: "03",
    title: "OtakuDynamics",
    category: "Anime Discovery & Watchlist Engine",
    year: "2024",
    tech: ["React.js", "Firebase", "Tailwind CSS", "Jikan API"],
    description:
      "High-performance anime discovery and tracking platform engineered with instant client-side state caching, real-time synchronized watchlists powered by Firebase Firestore, and faceted filtering across 20,000+ indexed titles.",
    image: "/projects/project3.png",
    video: "/projects/project3.mp4",
    url: "https://otaku-dynamics.vercel.app/",
  },
];

interface CraftSectionProps {
  activeSlide: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  sectionRef?: React.RefObject<HTMLElement | null>;
  tier?: DeviceTier;
}

export default function CraftSection({
  activeSlide,
  scrollContainerRef,
  sectionRef,
  tier = "high",
}: CraftSectionProps) {
  const [mediaAspects, setMediaAspects] = useState<Record<string, number>>({});
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [mobileActiveSlide, setMobileActiveSlide] = useState(0);

  // Track scroll exactly within the bounds of this section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    container: scrollContainerRef || undefined,
    offset: ["start start", "end end"],
  });

  const trackY = useTransform(scrollYProgress, [0, 1], ["0%", "-66.666%"]);

  // ── Robust IntersectionObserver for Mobile & Natural Scroll Playback ──
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isMobile = window.innerWidth <= 768;
        entries.forEach((entry) => {
          const index = cardRefs.current.indexOf(entry.target as HTMLDivElement);
          if (index === -1) return;

          const videoEl = videoRefs.current[index];

          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            if (isMobile) {
              setMobileActiveSlide(index);
            }
            if (videoEl) {
              const playPromise = videoEl.play();
              if (playPromise !== undefined) {
                playPromise.catch(() => {});
              }
            }
          } else {
            // When scrolled off screen, pause to release hardware decoder
            if (videoEl) {
              videoEl.pause();
            }
          }
        });
      },
      {
        threshold: [0.15, 0.35, 0.6],
      }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // ── Desktop Slide Sync Fallback ──
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth > 768) {
      videoRefs.current.forEach((videoEl, index) => {
        if (!videoEl) return;
        if (index === activeSlide) {
          const playPromise = videoEl.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
        } else {
          videoEl.pause();
        }
      });
    }
  }, [activeSlide]);

  // Broadcast image hover state for cursor morphing
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as CraftWindow).__craftImageHovered = false;
    }
    return () => {
      if (typeof window !== "undefined") {
        (window as CraftWindow).__craftImageHovered = false;
      }
    };
  }, []);

  const displayedSlide =
    typeof window !== "undefined" && window.innerWidth <= 768
      ? mobileActiveSlide
      : activeSlide;

  return (
    <div className="craft-container">
      {/* Header — sticky at top of the viewport */}
      <div className="craft-header">
        <div className="craft-header-left">
          <div className="craft-title-wrap">
            <h2 className="craft-title">CRAFT</h2>
            <div className="craft-header-counter tabular-nums">
              <span className="current">0{displayedSlide + 1}</span>
              <span className="sep">/</span>
              <span className="total">0{PROJECTS.length}</span>
            </div>
          </div>
          <div className="craft-subtitle-meta">
            <span>SELECTED WORK</span>
            <span className="craft-sep">{"//"}</span>
            <span>2024 — 2026</span>
          </div>
        </div>
      </div>

      {/* Vertical scrolling project cards */}
      <div className="craft-track-wrapper">
        <motion.div style={{ y: trackY }} className="craft-track">
          {PROJECTS.map((project, idx) => (
            <div
              key={project.id}
              ref={(el) => {
                cardRefs.current[idx] = el;
              }}
              className="project-card"
            >
              {/* Left: Metadata */}
              <div className="project-meta-col">
                <div className="meta-category-year">
                  <span className="category">{project.category}</span>
                  <span className="dot-divider" />
                  <span className="year">{project.year}</span>
                </div>

                <h3 className="project-title">{project.title}</h3>
                <p className="project-desc">{project.description}</p>

                <div className="project-tech-stack">
                  <span className="stack-label">STACK {"//"}</span>
                  <span className="tech-tags">{project.tech.join(", ")}</span>
                </div>

                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link"
                >
                  <span>EXPLORE WORK</span>
                  <span className="arrow">↗</span>
                </a>
              </div>

              {/* Right: Project presentation with throttled video decoders */}
              <div className="project-frame-col">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-image-wrap"
                  data-craft-image
                  style={{
                    aspectRatio: mediaAspects[project.id]
                      ? `${mediaAspects[project.id]}`
                      : "16 / 10",
                  }}
                  onMouseEnter={() => {
                    if (typeof window !== "undefined") {
                      (window as CraftWindow).__craftImageHovered = true;
                    }
                  }}
                  onMouseLeave={() => {
                    if (typeof window !== "undefined") {
                      (window as CraftWindow).__craftImageHovered = false;
                    }
                  }}
                >
                  {project.video ? (
                    <video
                      ref={(el) => {
                        videoRefs.current[idx] = el;
                      }}
                      src={project.video}
                      loop
                      muted
                      playsInline
                      preload={tier === "low" ? "none" : idx === 0 ? "auto" : "metadata"}
                      className="project-image"
                      style={{
                        objectFit: "contain",
                        width: "100%",
                        height: "100%",
                        background: "#09090b",
                      }}
                      onLoadedMetadata={(e) => {
                        const video = e.currentTarget;
                        if (video.videoWidth && video.videoHeight) {
                          setMediaAspects((prev) => ({
                            ...prev,
                            [project.id]: video.videoWidth / video.videoHeight,
                          }));
                        }
                      }}
                    />
                  ) : (
                    <div
                      className="project-image"
                      style={{
                        background: "#18181b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "14px",
                      }}
                    >
                      {project.title}
                    </div>
                  )}
                </a>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="craft-bottom-bar">
        <Link href="/craft" className="project-link" style={{ borderWidth: "0 0 1.5px 0" }}>
          <span>VIEW ALL WORKS</span>
          <span className="arrow" style={{ marginLeft: "6px" }}>
            →
          </span>
        </Link>
      </div>

      {/* Mobile scroll-snap helper anchors */}
      <div className="mobile-snap-container">
        <div className="mobile-snap-anchor" />
        <div className="mobile-snap-anchor" />
        <div className="mobile-snap-anchor" />
      </div>
    </div>
  );
}
