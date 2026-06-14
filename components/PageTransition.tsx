"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Lightweight page transition using CSS animations instead of AnimatePresence.
 * Avoids the unmount/remount cycle that breaks Three.js WebGL canvases.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Trigger a subtle fade-in on route change
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 50);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div
      className={`page-transition-wrapper ${isTransitioning ? "page-entering" : "page-visible"}`}
    >
      {children}
    </div>
  );
}
