"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Lightweight page transition using CSS animations and key-based re-triggering.
 * Avoids cascading setState-in-effect renders and unmount cycles.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-transition-wrapper page-visible">
      {children}
    </div>
  );
}
