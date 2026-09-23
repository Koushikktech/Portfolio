"use client";

import { motion } from "framer-motion";
import { useState, RefObject, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { setHasBooted } from "@/lib/bootState";

interface NavbarProps {
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  scrollToSlide?: (idx: number) => void;
  scrollToAbout?: () => void;
}

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Craft", href: "/craft" },
  { label: "Lab", href: "/lab" },
  { label: "About", href: "/#about" },
];

export default function Navbar({
  scrollToSlide,
  scrollToAbout,
}: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Derived state directly from pathname — zero cascading render effects
  const activeIndex = NAV_ITEMS.findIndex((item) => {
    if (item.href === "/" || item.href === "/#about") {
      if (item.href === "/#about") return false;
      return pathname === "/";
    }
    return pathname.startsWith(item.href);
  });

  // Handle Home click — scroll to top on homepage, navigate from other pages
  const handleHomeClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setHasBooted(true);
      if (pathname === "/") {
        if (scrollToSlide) {
          scrollToSlide(-1);
        } else {
          const scrollContainer = document.querySelector(".scroll-root");
          if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
          }
        }
      } else {
        router.push("/");
      }
    },
    [pathname, scrollToSlide, router]
  );

  // Handle About click — scroll on homepage, navigate from other pages
  const handleAboutClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setHasBooted(true);
      if (pathname === "/") {
        if (scrollToAbout) {
          scrollToAbout();
        } else {
          const aboutEl = document.getElementById("about");
          if (aboutEl) {
            aboutEl.scrollIntoView({ behavior: "smooth" });
          }
        }
      } else {
        router.push("/?scrollTo=about");
      }
    },
    [pathname, scrollToAbout, router]
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
                <Link
                  href="/"
                  onClick={handleHomeClick}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  <span className="nav-text">
                    {item.label}
                    {showCursor && <span className="nav-cursor">_</span>}
                  </span>
                </Link>
              ) : isAbout ? (
                <Link
                  href="/#about"
                  onClick={handleAboutClick}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  <span className="nav-text">
                    {item.label}
                    {showCursor && <span className="nav-cursor">_</span>}
                  </span>
                </Link>
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
