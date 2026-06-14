"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

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
    category: "Digital Space For Creators",
    year: "2026 - Ongoing (Work-in-progress)",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase"],
    description:
      "Creatorly is an AI-powered all-in-one platform for creators, combining the functionality of a link-in-bio tool, digital store, content hub, and audience management system. It enables creators to showcase, sell, and manage everything they create from a single, personalized digital space.",
    image: "/projects/project1.png",
    video: "/projects/project1.mp4",
    url: "https://creatorly.space/",
  },
  {
    id: "02",
    title: "NovaSecurity",
    category: "Vulnerability Detection System",
    year: "2026",
    tech: ["Next.js", "Tailwind CSS", "LangGraph", "Amazon Nova", "Python"],
    description:
      "NovaSecurity is an AI-powered vulnerability detection system for web applications. Built on a graph-based multi-stage agentic framework, it analyzes code, detects vulnerabilities in real time, and provides fixes to help developers build more secure applications.",
    image: "/projects/project2.png",
    video: "/projects/project2.mp4",
    url: "https://github.com/Koushikktech/NovaSecurity-Backend",
  },
  {
    id: "03",
    title: "OtakuDynamics",
    category: "Anime Tracking",
    year: "2024",
    tech: ["React.js", "Firebase", "Tailwind CSS"],
    description:
      "OtakuDynamics is an anime tracking and discovery platform that enables users to manage watchlists, save favorite series, access detailed anime information, and keep up with the latest anime updates—all from a single, user-friendly dashboard.",
    image: "/projects/project3.png",
    video: "/projects/project3.mp4",
    url: "https://otaku-dynamics.vercel.app/",
  },
];

interface CraftSectionProps {
  activeSlide: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  sectionRef?: React.RefObject<HTMLElement | null>;
}

export default function CraftSection({
  activeSlide,
  scrollContainerRef,
  sectionRef,
}: CraftSectionProps) {
  const [mediaAspects, setMediaAspects] = useState<Record<string, number>>({});
  
  // Track scroll exactly within the bounds of this section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    container: scrollContainerRef || undefined,
    offset: ["start start", "end end"]
  });

  // The track contains 3 cards stacked vertically, each taking 100% of the wrapper height.
  // Track total height = 300% of wrapper.
  // To scroll from card 1 to card 3, we translate the track up by 2 card heights.
  // 2 card heights = 2/3 of the track's own height = 66.666%.
  // scrollYProgress already goes 0 -> 1 correctly within the section bounds
  const trackY = useTransform(scrollYProgress, [0, 1], ["0%", "-66.666%"]);

  // Broadcast image hover state for cursor morphing
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__craftImageHovered = false;
    }
    return () => {
      if (typeof window !== "undefined") {
        (window as any).__craftImageHovered = false;
      }
    };
  }, []);

  return (
    <div className="craft-container">
      {/* Header — sticky at top of the viewport */}
      <div className="craft-header">
        <div className="craft-header-left">
          <div className="craft-title-wrap">
            <h2 className="craft-title">CRAFT</h2>
            <div className="craft-header-counter">
              <span className="current">0{activeSlide + 1}</span>
              <span className="sep">/</span>
              <span className="total">0{PROJECTS.length}</span>
            </div>
          </div>
          <div className="craft-subtitle-meta">
            <span>SELECTED WORK</span>
            <span className="craft-sep">//</span>
            <span>2024 — 2026</span>
          </div>
        </div>
      </div>

      {/* Vertical scrolling project cards */}
      <div className="craft-track-wrapper">
        <motion.div style={{ y: trackY }} className="craft-track">
          {PROJECTS.map((project) => (
            <div key={project.id} className="project-card">
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
                  <span className="stack-label">STACK //</span>
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

              {/* Right: Project screenshot */}
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
                      (window as any).__craftImageHovered = true;
                    }
                  }}
                  onMouseLeave={() => {
                    if (typeof window !== "undefined") {
                      (window as any).__craftImageHovered = false;
                    }
                  }}
                >
                  {project.video ? (
                    <video
                      src={project.video}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="project-image"
                      style={{
                        objectFit: "contain",
                        width: "100%",
                        height: "100%",
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
                    <img
                      src={project.image}
                      alt={project.title}
                      className="project-image"
                      draggable={false}
                      style={{
                        objectFit: "contain",
                        width: "100%",
                        height: "100%",
                      }}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        if (img.naturalWidth && img.naturalHeight) {
                          setMediaAspects((prev) => ({
                            ...prev,
                            [project.id]: img.naturalWidth / img.naturalHeight,
                          }));
                        }
                      }}
                    />
                  )}
                </a>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom spacer for visual balance */}
      <div className="craft-bottom-bar">
        <Link href="/craft" className="project-link" style={{ borderWidth: '0 0 1.5px 0' }}>
          <span>VIEW ALL WORKS</span>
          <span className="arrow" style={{ marginLeft: '6px' }}>→</span>
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
