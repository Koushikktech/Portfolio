"use client";

import { useRef, useEffect, useState } from "react";

/* ────────────────────────────────────────────────────────
   CustomCursor — Premium Neon Lime Dot & Expanding Ring
   
   Standalone component that lives at page level.
   Never unmounted — always visible across all sections.
   ──────────────────────────────────────────────────────── */

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Track if mouse has moved at least once
  const [hasMoved, setHasMoved] = useState(false);

  useEffect(() => {
    let raf: number;
    let lastTime = performance.now();

    // Mouse state
    let mouseX = -200;
    let mouseY = -200;
    let moved = false;
    let isInteractive = false;
    let scrollRootEl: Element | null = null;

    // Dot position (instant-tracking)
    let cx = -200;
    let cy = -200;

    // Ring position (spring-damped)
    let rx = -200;
    let ry = -200;
    let rw = 24;

    // Ring velocity for spring physics
    let rvx = 0;
    let rvy = 0;

    let currentOpacity = 0;
    let currentRingOpacity = 0;
    let expandProgress = 0; // track visual ring enlargement separately
    let craftImageExpand = 0; // smooth progress for craft image hover

    // --- Event handlers ---
    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!moved) {
        moved = true;
        setHasMoved(true);
      }
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      isInteractive =
        target.closest("a, button, [role='button']") !== null ||
        window.getComputedStyle(target).cursor === "pointer";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);

    // --- Animation loop ---
    const tick = (now: number) => {
      if (!cursorRef.current || !ringRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTime = now;

      // ── 1. Inner dot: exponential lerp
      const aDot = 1 - Math.exp(-18 * dt);
      cx += (mouseX - cx) * aDot;
      cy += (mouseY - cy) * aDot;
      cursorRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;

      // ── 2. Ring: spring-damper physics
      const normalDiameter = 24;
      let targetRingX = cx;
      let targetRingY = cy;
      let targetRingW = normalDiameter;
      let stiffness = 220;
      let damping = 26;

      // Read scroll root to disable bubble interactions in Craft section
      if (!scrollRootEl) {
        scrollRootEl = typeof document !== "undefined" ? document.querySelector(".scroll-root") : null;
      }
      const scrollTop = scrollRootEl ? scrollRootEl.scrollTop : 0;
      const isHero = scrollTop < 100;

      // Read window variables updated by FluidBubble
      const bubbleHover = isHero && typeof window !== "undefined" ? (window as any).bubbleHoverProgress || 0 : 0;
      const isBubbleHovered = isHero && typeof window !== "undefined" ? (window as any).isBubbleHovered || false : false;
      const holdProgress = isHero && typeof window !== "undefined" ? (window as any).bubbleHoldProgress || 0 : 0;
      const bubbleX = isHero && typeof window !== "undefined" ? (window as any).bubbleX || 0 : 0;
      const bubbleY = isHero && typeof window !== "undefined" ? (window as any).bubbleY || 0 : 0;

      // Smoothly animate local expandProgress (only when physically inside the bubble)
      const targetExpand = isBubbleHovered ? 1 : 0;
      const aExpand = 1 - Math.exp(-10 * dt);
      expandProgress += (targetExpand - expandProgress) * aExpand;

      // Read craft image hover state (set by CraftSection onMouseEnter/Leave)
      const craftImageHovered = typeof window !== "undefined" ? (window as any).__craftImageHovered || false : false;

      // Smoothly interpolate craftImageExpand for fluid cursor morphing
      const targetCraftExpand = craftImageHovered ? 1 : 0;
      const aCraft = 1 - Math.exp(-10 * dt);
      craftImageExpand += (targetCraftExpand - craftImageExpand) * aCraft;

      if (isInteractive && craftImageExpand < 0.1) {
        targetRingW = 44;
        stiffness = 300;
        damping = 30;
      } else if (craftImageExpand > 0.1) {
        // Morph into a larger bubble shape over the project image
        targetRingW = 24 + craftImageExpand * 46; // smooth from 24 → 70
        stiffness = 180;
        damping = 24;
      } else if (expandProgress > 0) {
        // Expand ring near bubble to wrap the bubble (slightly lower radius than bubble)
        const vh = typeof window !== "undefined" ? window.innerHeight : 800;
        const bubbleDiameter = vh * 0.44; 
        
        targetRingW = normalDiameter + expandProgress * (bubbleDiameter - normalDiameter);
        stiffness = 220 - expandProgress * 140; // softer spring for organic fluid feel
        damping = 26 - expandProgress * 8;
      }

      // Magnetic pull: pull the ring center towards the bubble center when approaching or inside
      if (bubbleHover > 0 && bubbleX > 0 && bubbleY > 0) {
        targetRingX = cx + (bubbleX - cx) * bubbleHover * 0.85;
        targetRingY = cy + (bubbleY - cy) * bubbleHover * 0.85;
      }

      // Squeeze outer ring during pop hold
      if (holdProgress > 0) {
        targetRingW = targetRingW - holdProgress * (targetRingW - 32);
        stiffness = 220 + holdProgress * 150;
        damping = 26 + holdProgress * 10;
      }

      const fx = -stiffness * (rx - targetRingX) - damping * rvx;
      const fy = -stiffness * (ry - targetRingY) - damping * rvy;
      rvx += fx * dt;
      rvy += fy * dt;
      rx += rvx * dt;
      ry += rvy * dt;

      const aSizeRing = 1 - Math.exp(-12 * dt);
      rw += (targetRingW - rw) * aSizeRing;

      ringRef.current.style.width = `${rw}px`;
      ringRef.current.style.height = `${rw}px`;
      ringRef.current.style.transform = `translate3d(${rx - rw / 2}px, ${ry - rw / 2}px, 0)`;

      // Toggle class for craft image hover state (controls border styling via CSS)
      if (craftImageExpand > 0.3) {
        ringRef.current.classList.add("is-craft-image");
      } else {
        ringRef.current.classList.remove("is-craft-image");
      }

      // Hide dot when in craft image hover mode for a clean bubble look
      const dotEl = cursorRef.current?.querySelector(".cursor-dot") as HTMLElement | null;
      if (dotEl) {
        dotEl.style.opacity = craftImageExpand > 0.2 ? `${1 - craftImageExpand}` : "1";
      }

      // ── 3. Cursor Hold Loader Label
      if (labelRef.current && progressRef.current) {
        if (holdProgress > 0.01) {
          labelRef.current.style.opacity = "1";
          labelRef.current.style.transform = `translate3d(${cx}px, ${cy + 28}px, 0)`;
          progressRef.current.style.transform = `scaleX(${holdProgress})`;
        } else {
          labelRef.current.style.opacity = "0";
          progressRef.current.style.transform = "scaleX(0)";
        }
      }

      // ── 4. Opacity
      const aOpacity = 1 - Math.exp(-8 * dt);
      const targetDotOpacity = moved ? 1 : 0;
      const targetRingOpacity = moved ? 1 : 0;

      currentOpacity += (targetDotOpacity - currentOpacity) * aOpacity;
      currentRingOpacity += (targetRingOpacity - currentRingOpacity) * aOpacity;

      cursorRef.current.style.opacity = `${currentOpacity}`;
      ringRef.current.style.opacity = `${currentRingOpacity}`;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);

  // Don't render anything until we detect hover-capable device
  // (touch-only devices handled via CSS display:none)
  return (
    <>
      {/* Trailing ring */}
      <div ref={ringRef} className="cursor-ring" style={{ opacity: 0 }} />

      {/* Inner neon lime dot */}
      <div ref={cursorRef} className="custom-cursor" style={{ opacity: 0 }}>
        <div className="cursor-dot" />
      </div>

      {/* Cursor Hold Label (morphed from FluidBubble interaction) */}
      <div ref={labelRef} className="cursor-label" style={{ opacity: 0 }}>
        <div className="cursor-label-inner">
          <span className="cursor-text-hold">HOLD</span>
          <div className="cursor-underline-track">
            <div ref={progressRef} className="cursor-underline-progress" />
          </div>
        </div>
      </div>
    </>
  );
}
