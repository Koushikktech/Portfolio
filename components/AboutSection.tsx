"use client";

import {
  SiNextdotjs,
  SiHtml5,
  SiJavascript,
  SiTailwindcss,
  SiPython,
  SiFastapi,
  SiSupabase,
  SiNodedotjs,
  SiFramer,
  SiMongodb,
  SiPostgresql,
  SiLinux,
  SiPytorch,
  SiDocker,
  SiC,
  SiWordpress,
} from "react-icons/si";
import { TbNetwork } from "react-icons/tb";

interface AboutSectionProps {
  isEmbedded?: boolean; // true when inside homepage scroll container
}

export default function AboutSection({
  isEmbedded = false,
}: AboutSectionProps) {
  const techSkills = [
    { name: "Next.js / React", icon: SiNextdotjs, color: "#ffffff" },
    { name: "HTML", icon: SiHtml5, color: "#E34F26" },
    { name: "CSS / Tailwind", icon: SiTailwindcss, color: "#06B6D4" },
    { name: "JS / TS", icon: SiJavascript, color: "#F7DF1E" },
    { name: "Framer Motion", icon: SiFramer, color: "#0055FF" },
    { name: "Node.js", icon: SiNodedotjs, color: "#339933" },
    { name: "Python", icon: SiPython, color: "#3776AB" },
    { name: "FastAPI", icon: SiFastapi, color: "#009688" },
    { name: "LangGraph", icon: TbNetwork, color: "#FF7B00" },
    { name: "PyTorch", icon: SiPytorch, color: "#EE4C2C" },
    { name: "Supabase", icon: SiSupabase, color: "#3ECF8E" },
    { name: "MongoDB", icon: SiMongodb, color: "#47A248" },
    { name: "SQL", icon: SiPostgresql, color: "#4169E1" },
    { name: "Docker", icon: SiDocker, color: "#2496ED" },
    { name: "Cloud / Linux", icon: SiLinux, color: "#FCC624" },
    { name: "C", icon: SiC, color: "#A8B9CC" },
    { name: "WordPress", icon: SiWordpress, color: "#21759B" },
  ];

  return (
    <section id="about" className="about-section">
      {/* Section divider */}
      <div className="about-divider">
        <div className="about-divider-line" />
        <span className="about-divider-label">ABOUT</span>
        <div className="about-divider-line" />
      </div>

      <div className="about-inner">
        {/* Header */}
        <header className="about-header">
          <div className="about-header-left">
            <div className="craft-title-wrap">
              <h2
                className="craft-title"
                style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
              >
                ABOUT
              </h2>
            </div>
            <p className="craft-subtitle-meta" style={{ marginTop: "12px" }}>
              <span>Full-Stack Engineer • AI Automation</span>
              <span className="craft-sep">//</span>
              <span>BIOGRAPHY & SKILLS</span>
            </p>
          </div>
        </header>

        {/* Layout grid */}
        <div className="about-grid">
          {/* Biography */}
          <div className="about-bio">
            <h3 className="about-section-label">THE PROFILE //</h3>
            <p className="about-bio-main">
              I'm Koushik, a Full-Stack Developer and AI Automation specialist
              who enjoys building clean solutions that actually ship and
              building systems for businesses.
            </p>
            <p className="about-bio-sub">
              I started exploring tech early, diving into cloud systems,
              servers, and networking before moving into web development. These
              days I build with Next.js, Node.js, Python, and LangGraph, and I
              have a solid background working with APIs, Cloud infrastructure,
              and freelance client work.
            </p>
            <p className="about-bio-sub">
              Right now I'm focused on AI and automation, building tools that
              actually do useful things, not just demos. I'm also working on my
              own projects and always open to interesting collaborations.
            </p>
          </div>

          {/* Socials & Information */}
          <div className="about-contact-card">
            <div>
              <h3 className="about-contact-label">CONTACT / CONNECT</h3>
              <div className="about-contact-links">
                <a
                  href="mailto:contact@koushikk.me"
                  className="project-link"
                  style={{
                    fontSize: "13px",
                    alignSelf: "flex-start",
                    borderWidth: "0 0 1px 0",
                  }}
                >
                  <span>EMAIL // contact@koushikk.me</span>
                </a>
                <a
                  href="https://github.com/Koushikktech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link"
                  style={{
                    fontSize: "13px",
                    alignSelf: "flex-start",
                    borderWidth: "0 0 1px 0",
                  }}
                >
                  <span>GITHUB // @Koushikktech</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/koushikktech/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-link"
                  style={{
                    fontSize: "13px",
                    alignSelf: "flex-start",
                    borderWidth: "0 0 1px 0",
                  }}
                >
                  <span>LINKEDIN // koushikktech</span>
                </a>
              </div>
            </div>

            <div className="about-location">
              <span className="about-location-label">LOCATION</span>
              <span className="about-location-value">Hyderabad, India</span>
            </div>
          </div>
        </div>

        {/* Skills grid */}
        <h3
          className="about-section-label"
          style={{
            marginBottom: "32px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            paddingBottom: "12px",
          }}
        >
          THE TECH STACK & TOOLS //
        </h3>

        <div className="about-skills-wrapper">
          {techSkills.map((skill) => (
            <div key={skill.name} className="about-skill-tag">
              <skill.icon
                className="about-skill-icon"
                style={{ color: skill.color }}
              />
              <span>{skill.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Homepage Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="footer-name">KOUSHIKK</span>
              <span className="footer-tagline">
               Full-Stack Engineer • AI Automation
              </span>
            </div>
            <div className="footer-links">
              <a href="mailto:contact@koushikk.me" className="footer-link">
                Email
              </a>
              <a
                href="https://github.com/Koushikktech"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/koushikktech/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                LinkedIn
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copyright">
              © {new Date().getFullYear()} Koushikk. All rights reserved.
            </span>
            <span className="footer-location">Hyderabad, India</span>
          </div>
        </div>
      </footer>
    </section>
  );
}
