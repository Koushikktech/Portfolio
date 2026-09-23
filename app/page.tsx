"use client";

import { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import Navbar from "@/components/Navbar";
import CraftSection from "@/components/CraftSection";
import SnakeBootScreen from "@/components/SnakeBootScreen";
import AboutSection from "@/components/AboutSection";
import FluidBubble from "@/components/FluidBubble";
import FluidBubbleFallback from "@/components/FluidBubbleFallback";
import { FluidBubbleErrorBoundary } from "@/components/FluidBubbleErrorBoundary";
import { useDeviceTier, RuntimeFPSWatchdog } from "@/lib/deviceTier";
import { getHasBooted, setHasBooted } from "@/lib/bootState";

const emptySubscribe = () => () => {};

export default function Home() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const craftRef = useRef<HTMLElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const navWrapperRef = useRef<HTMLDivElement>(null);

  const [activeSlide, setActiveSlide] = useState(0);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const targetScrollTopRef = useRef(0);

  // Zero-cascade hydration check via useSyncExternalStore
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Device capability & tiering
  const { tier, capabilities } = useDeviceTier();

  // Show loading screen on browser reload/refresh, but never during client-side navigation
  const [isBooting, setIsBooting] = useState(() => !getHasBooted());

  const isBootingRef = useRef(isBooting);
  useEffect(() => {
    isBootingRef.current = isBooting;
  }, [isBooting]);

  const handleBootComplete = useCallback(() => {
    setHasBooted(true);
    setIsBooting(false);
  }, []);

  // Initialize runtime FPS watchdog to catch sustained frame drops
  useEffect(() => {
    const watchdog = new RuntimeFPSWatchdog();
    watchdog.start();
    return () => watchdog.stop();
  }, []);

  // Handle scrollTo query param
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
    let lastSetProgress = -1;
    let lastTime = performance.now();
    let currentScroll = container.scrollTop;

    targetScrollTopRef.current = container.scrollTop;

    const isTouchDevice = () => {
      if (typeof window === "undefined") return false;
      return window.matchMedia("(pointer: coarse)").matches;
    };

    const SMOOTH_SPEED = 7;
    let lastWheelTime = 0;
    let hasWheeled = false;

    const update = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTime = now;

      const viewportH = container.clientHeight || window.innerHeight;

      if (!isTouchDevice()) {
        const externalDiff = Math.abs(
          container.scrollTop - Math.round(currentScroll)
        );
        if (externalDiff > 30) {
          currentScroll = container.scrollTop;
          targetScrollTopRef.current = container.scrollTop;
          hasWheeled = true;
          lastWheelTime = now;
        }

        const alpha = 1 - Math.exp(-SMOOTH_SPEED * dt);
        const diff = targetScrollTopRef.current - currentScroll;

        if (Math.abs(diff) > 1.0) {
          currentScroll += diff * alpha;
          container.scrollTop = Math.round(currentScroll);
        } else {
          currentScroll = targetScrollTopRef.current;
          container.scrollTop = Math.round(targetScrollTopRef.current);
        }

        const timeSinceWheel = (now - lastWheelTime) / 1000;
        if (hasWheeled && Math.abs(diff) < 5 && timeSinceWheel > 0.6) {
          hasWheeled = false;
          if (currentScroll < viewportH) {
            const nearest = currentScroll < viewportH * 0.4 ? 0 : viewportH;
            targetScrollTopRef.current = nearest;
          }
        }
      } else {
        currentScroll = container.scrollTop;
        targetScrollTopRef.current = currentScroll;
      }

      const actualScrollTop = container.scrollTop;

      // Theme progress: 0 at top of hero, 1 at start of craft section (100vh)
      const rawProgress = Math.min(1, Math.max(0, actualScrollTop / viewportH));
      progressRef.current = rawProgress;

      const themeAlpha = 1 - Math.exp(-8 * dt);
      smoothProgress += (rawProgress - smoothProgress) * themeAlpha;

      if (smoothProgress > 0.998) smoothProgress = 1;
      if (smoothProgress < 0.002) smoothProgress = 0;

      if (Math.abs(smoothProgress - lastSetProgress) > 0.002) {
        lastSetProgress = smoothProgress;
        if (navWrapperRef.current) {
          navWrapperRef.current.style.setProperty(
            "--scroll-progress",
            String(smoothProgress)
          );
        }
      }

      // ── Visibility Occlusion Culling ──
      // Hero is considered visible only while partially on screen
      const heroVisible = actualScrollTop < viewportH * 0.9;
      setIsHeroVisible((prev) => (prev !== heroVisible ? heroVisible : prev));

      // Active slide tracking
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

      // Fade canvas as user scrolls into craft
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

    const onWheel = (e: WheelEvent) => {
      if (isBootingRef.current) return;
      if (isTouchDevice()) return;
      e.preventDefault();

      const maxScroll = container.scrollHeight - container.clientHeight;
      targetScrollTopRef.current = Math.min(
        maxScroll,
        Math.max(0, targetScrollTopRef.current + e.deltaY)
      );

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

  const scrollToSlide = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const viewportH = container.clientHeight || window.innerHeight;
    const target = index === -1 ? 0 : (index + 1) * viewportH;
    targetScrollTopRef.current = target;
  }, []);

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
      {/* Navbar — fixed */}
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
            {/* Adaptive Rendering: Mount 3D WebGL FluidBubble on all WebGL-capable devices.
                Pure CSS/SVG fallback is only used during pre-hydration or on non-WebGL environments. */}
            {!isMounted || !capabilities.canUseWebGL ? (
              <FluidBubbleFallback />
            ) : (
              <FluidBubbleErrorBoundary fallback={<FluidBubbleFallback />}>
                <FluidBubble isVisible={isHeroVisible} tier={tier} />
              </FluidBubbleErrorBoundary>
            )}
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
            tier={tier}
          />
        </section>

        {/* ─── Section 3: About ─── */}
        <AboutSection isEmbedded={true} />
      </div>

      {/* Accelerated Canvas boot screen overlay */}
      {isBooting && <SnakeBootScreen onComplete={handleBootComplete} />}
    </>
  );
}
