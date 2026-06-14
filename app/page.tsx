"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import FluidBubble from "@/components/FluidBubble";
import Navbar from "@/components/Navbar";
import CraftSection from "@/components/CraftSection";
import CustomCursor from "@/components/CustomCursor";
import SnakeBootScreen from "@/components/SnakeBootScreen";
import AboutSection from "@/components/AboutSection";

export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const craftRef = useRef<HTMLElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const navWrapperRef = useRef<HTMLDivElement>(null);

  const [activeSlide, setActiveSlide] = useState(0);
  const targetScrollTopRef = useRef(0);

  // Session-aware booting: always start true (matches SSR), then check sessionStorage on mount
  const [isBooting, setIsBooting] = useState(true);
  const isBootingRef = useRef(true);

  // Check sessionStorage after mount to skip loading if already booted this session
  useEffect(() => {
    if (sessionStorage.getItem("portfolio_booted")) {
      setIsBooting(false);
      isBootingRef.current = false;
    }
  }, []);

  useEffect(() => {
    isBootingRef.current = isBooting;
  }, [isBooting]);

  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
    sessionStorage.setItem("portfolio_booted", "1");
  }, []);

  // Handle scrollTo query param (from About nav link on other pages)
  // Uses window.location directly to avoid useSearchParams Suspense issues
  useEffect(() => {
    if (isBooting) return;
    const params = new URLSearchParams(window.location.search);
    const scrollTo = params.get("scrollTo");
    if (scrollTo === "about") {
      setTimeout(() => {
        const aboutEl = document.getElementById("about");
        if (aboutEl && scrollRef.current) {
          targetScrollTopRef.current = aboutEl.offsetTop;
        }
        // Clean up the URL without triggering navigation
        window.history.replaceState({}, "", "/");
      }, 150);
    }
  }, [isBooting]);

  // --- Scroll-driven theme interpolation & desktop smooth scroll ---
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let raf: number;
    let smoothProgress = 0;
    let lastSetProgress = -1; // Track last value set to avoid needless CSS recalcs
    let lastTime = performance.now();
    let currentScroll = container.scrollTop;

    // Initialize target to current scroll on mount
    targetScrollTopRef.current = container.scrollTop;

    const isTouchDevice = () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(pointer: coarse)").matches;
    };

    // ── Scroll physics config ──
    const SMOOTH_SPEED = 7;

    // ── Soft-snap state ──
    // Tracks when the user last scrolled to determine when they've "stopped"
    let lastWheelTime = 0;
    let hasWheeled = false;

    const update = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05); // cap to prevent jumps on tab-switch
      lastTime = now;

      const viewportH = container.clientHeight || window.innerHeight;

      if (!isTouchDevice()) {
        // Detect external scroll changes (keyboard navigation, programmatic scroll)
        const externalDiff = Math.abs(
          container.scrollTop - Math.round(currentScroll),
        );
        if (externalDiff > 30) {
          currentScroll = container.scrollTop;
          targetScrollTopRef.current = container.scrollTop;
          hasWheeled = true;
          lastWheelTime = now;
        }

        // Frame-rate independent exponential smoothing
        const alpha = 1 - Math.exp(-SMOOTH_SPEED * dt);
        const diff = targetScrollTopRef.current - currentScroll;

        if (Math.abs(diff) > 1.0) {
          currentScroll += diff * alpha;
          container.scrollTop = Math.round(currentScroll);
        } else {
          currentScroll = targetScrollTopRef.current;
          container.scrollTop = Math.round(targetScrollTopRef.current);
        }

        // ── Soft snap: only snap between hero and craft boundary ──
        // Inside the craft section, scrolling is free — no per-card snapping.
        const timeSinceWheel = (now - lastWheelTime) / 1000;
        if (hasWheeled && Math.abs(diff) < 5 && timeSinceWheel > 0.6) {
          hasWheeled = false;

          // Only snap in the hero→craft transition zone
          if (currentScroll < viewportH) {
            const nearest = currentScroll < viewportH * 0.4 ? 0 : viewportH;
            targetScrollTopRef.current = nearest;
          }
          // Once inside craft section, let the user scroll freely
        }
      } else {
        // On touch devices, let the browser handle scroll natively
        currentScroll = container.scrollTop;
        targetScrollTopRef.current = currentScroll;
      }

      const actualScrollTop = container.scrollTop;

      // Theme progress: 0 at top of hero, 1 at start of craft section (100vh)
      const rawProgress = Math.min(1, Math.max(0, actualScrollTop / viewportH));
      progressRef.current = rawProgress;

      // Smooth the theme progress (also frame-rate independent)
      const themeAlpha = 1 - Math.exp(-8 * dt);
      smoothProgress += (rawProgress - smoothProgress) * themeAlpha;

      // Snap to exact boundaries when very close to avoid perpetual micro-updates
      if (smoothProgress > 0.998) smoothProgress = 1;
      if (smoothProgress < 0.002) smoothProgress = 0;

      // Only update CSS custom property when the value has meaningfully changed.
      // This prevents continuous style recalculation that causes text jitter in
      // the About section (every setProperty triggers a full CSS recalc).
      if (Math.abs(smoothProgress - lastSetProgress) > 0.002) {
        lastSetProgress = smoothProgress;
        if (navWrapperRef.current) {
          navWrapperRef.current.style.setProperty(
            "--scroll-progress",
            String(smoothProgress),
          );
        }
      }

      // Determine the active slide index based on scroll position.
      // Hero: 0–100vh, Project 0: 100–200vh, Project 1: 200–300vh, Project 2: 300–400vh
      let newActiveSlide = 0;
      if (actualScrollTop >= 2.5 * viewportH) {
        newActiveSlide = 2;
      } else if (actualScrollTop >= 1.5 * viewportH) {
        newActiveSlide = 1;
      }

      setActiveSlide((prev) => {
        if (prev !== newActiveSlide) return newActiveSlide;
        return prev;
      });

      // Fade the hero canvas as user scrolls into craft
      if (canvasWrapRef.current) {
        const fadeStart = 0.15;
        const fadeEnd = 0.75;
        const opacity =
          rawProgress <= fadeStart
            ? 1
            : rawProgress >= fadeEnd
              ? 0
              : 1 - (rawProgress - fadeStart) / (fadeEnd - fadeStart);

        canvasWrapRef.current.style.opacity = String(opacity);
        canvasWrapRef.current.style.transform = "none";
      }

      raf = requestAnimationFrame(update);
    };

    // ── Wheel interception ──
    // Accumulate deltas into the target. The smooth loop above handles all animation.
    // No snap timeout — the user controls exactly where they scroll.
    const onWheel = (e: WheelEvent) => {
      if (isBootingRef.current) return;
      if (isTouchDevice()) return;
      e.preventDefault();

      const maxScroll = container.scrollHeight - container.clientHeight;
      targetScrollTopRef.current = Math.min(
        maxScroll,
        Math.max(0, targetScrollTopRef.current + e.deltaY),
      );

      // Track scroll activity for soft-snap
      lastWheelTime = performance.now();
      hasWheeled = true;
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    raf = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("wheel", onWheel);
    };
  }, []);

  // --- Smooth scroll handler ---
  const scrollToSlide = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const viewportH = container.clientHeight || window.innerHeight;

    // index -1 = Hero, index 0,1,2 = Craft projects
    const target = index === -1 ? 0 : (index + 1) * viewportH;
    targetScrollTopRef.current = target;
  }, []);

  // --- Scroll to About section handler ---
  const scrollToAbout = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const aboutEl = document.getElementById("about");
    if (aboutEl) {
      container.scrollTop = aboutEl.offsetTop;
      targetScrollTopRef.current = aboutEl.offsetTop;
    }
  }, []);

  return (
    <>
      {/* Custom cursor — always mounted, always visible once booted */}
      {!isBooting && <CustomCursor />}

      {/* Navbar — fixed, above everything */}
      <div
        ref={navWrapperRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        <div style={{ pointerEvents: "auto" }}>
          <Navbar
            scrollContainerRef={scrollRef}
            scrollToSlide={scrollToSlide}
            scrollToAbout={scrollToAbout}
          />
        </div>
      </div>

      {/* Main scroll container */}
      <div
        ref={scrollRef}
        className={`scroll-root ${isBooting ? "booting-locked" : ""}`}
      >
        {/* ─── Section 1: Hero ─── */}
        <section ref={heroRef} className="hero-section" id="hero">
          <div ref={canvasWrapRef} className="hero-canvas-wrap">
            <FluidBubble />
          </div>

          {/* Scroll indicator */}
          <div className="scroll-indicator" onClick={() => scrollToSlide(0)}>
            <span className="scroll-indicator-text">SCROLL</span>
            <div className="scroll-indicator-line" />
          </div>

          <h1 className="sr-only">Koushikk — Full-Stack Developer</h1>
        </section>

        {/* ─── Section 2: Craft ─── */}
        <section ref={craftRef} className="craft-section" id="craft">
          <CraftSection
            activeSlide={activeSlide}
            scrollContainerRef={scrollRef}
            sectionRef={craftRef}
          />
        </section>

        {/* ─── Section 3: About ─── */}
        <AboutSection isEmbedded={true} />
      </div>

      {/* macOS style boot screen overlay */}
      {isBooting && <SnakeBootScreen onComplete={handleBootComplete} />}
    </>
  );
}
