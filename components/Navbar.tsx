"use client";

import { motion } from "framer-motion";
import { useState, useEffect, RefObject, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface NavbarProps {
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  scrollToSlide?: (idx: number) => void;
  scrollToAbout?: () => void;
}

// Moved outside component to avoid recreation on every render
const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Craft", href: "/craft" },
  { label: "Lab", href: "/lab" },
  { label: "About", href: "/#about" },
  // CV hidden for now — uncomment when ready:
  // { label: "CV", href: "/cv" },
];

export default function Navbar({
  scrollContainerRef,
  scrollToSlide,
  scrollToAbout,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Track active page from pathname
  useEffect(() => {
    const idx = NAV_ITEMS.findIndex((item) => {
      if (item.href === "/" || item.href === "/#about") {
        if (item.href === "/#about") return false; // About active state handled by scroll
        return pathname === "/";
      }
      return pathname.startsWith(item.href);
    });
    setActiveIndex(idx);
  }, [pathname]);

  // Handle Home click — scroll to top on homepage, navigate from other pages
  const handleHomeClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (pathname === "/") {
        // Already on homepage — smooth scroll to top
        if (scrollToSlide) {
          scrollToSlide(-1); // -1 = hero (top)
        } else {
          // Fallback: direct scroll
          const scrollContainer = document.querySelector(".scroll-root");
          if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      } else {
        // Navigate to homepage
        router.push("/");
      }
    },
    [pathname, scrollToSlide, router],
  );

  // Handle About click — scroll on homepage, navigate from other pages
  const handleAboutClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (pathname === "/") {
        // Already on homepage — smooth scroll to about section
        if (scrollToAbout) {
          scrollToAbout();
        } else {
          // Fallback: direct scroll
          const aboutEl = document.getElementById("about");
          if (aboutEl) {
            aboutEl.scrollIntoView({ behavior: "smooth" });
          }
        }
      } else {
        // Navigate to homepage with scrollTo param
        router.push("/?scrollTo=about");
      }
    },
    [pathname, scrollToAbout, router],
  );

  return (
    <motion.nav
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="site-nav"
    >
      <ul className="nav-links">
        {NAV_ITEMS.map((item, i) => {
          const isActive = activeIndex === i;
          const showCursor = hoveredIndex === i || isActive;
          const isAbout = item.label === "About";
          const isHome = item.label === "Home";

          return (
            <motion.li
              key={item.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.2 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="nav-item"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {isHome ? (
                <a
                  href="/"
                  onClick={handleHomeClick}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  <span className="nav-text">
                    {item.label}
                    {showCursor && <span className="nav-cursor">_</span>}
                  </span>
                </a>
              ) : isAbout ? (
                <a
                  href="/#about"
                  onClick={handleAboutClick}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  <span className="nav-text">
                    {item.label}
                    {showCursor && <span className="nav-cursor">_</span>}
                  </span>
                </a>
              ) : (
                <Link
                  href={item.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  <span className="nav-text">
                    {item.label}
                    {showCursor && <span className="nav-cursor">_</span>}
                  </span>
                </Link>
              )}
            </motion.li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
