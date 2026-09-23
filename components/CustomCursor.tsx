"use client";

import { useRef, useEffect } from "react";

interface CustomWindow extends Window {
  bubbleHoverProgress?: number;
  bubbleHoldProgress?: number;
  isBubbleHovered?: boolean;
  bubbleX?: number;
  bubbleY?: number;
  __craftImageHovered?: boolean;
}

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    let lastTime = performance.now();

    // Mouse & Pointer state
    let mouseX = -200;
    let mouseY = -200;
    let moved = false;
    let isWindowHovered = false;
    let isTouch = false;
    let isInteractive = false;
    let isMouseDown = false;
    let scrollRootEl: Element | null = null;

    // Follower ring position & velocity (spring-damper physics)
    let rx = -200;
    let ry = -200;
    let rw = 26;
    let rvx = 0;
    let rvy = 0;

    let currentOpacity = 0;
    let expandProgress = 0;
    let craftImageExpand = 0;

    let lastTouchTime = 0;

    const setCustomCursorActive = (active: boolean) => {
      if (typeof document === "undefined") return;
      if (active) {
        document.documentElement.classList.add("has-custom-cursor");
      } else {
        document.documentElement.classList.remove("has-custom-cursor");
      }
    };

    const updatePointerPos = (clientX: number, clientY: number) => {
      // Guard against synthetic mouse events fired immediately after touch taps
      if (performance.now() - lastTouchTime < 700) {
        return;
      }

      mouseX = clientX;
      mouseY = clientY;

      if (!moved) {
        rx = mouseX;
        ry = mouseY;
        moved = true;
      }

      isWindowHovered = true;
      isTouch = false;
      setCustomCursorActive(true);

      // Instant 0ms latency update for primary dot hotspot
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        lastTouchTime = performance.now();
        isTouch = true;
        isWindowHovered = false;
        setCustomCursorActive(false);
        return;
      }
      updatePointerPos(e.clientX, e.clientY);
    };

    const onMouseMove = (e: MouseEvent) => {
      updatePointerPos(e.clientX, e.clientY);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") {
        lastTouchTime = performance.now();
        isTouch = true;
        isWindowHovered = false;
        setCustomCursorActive(false);
        return;
      }
      isMouseDown = true;
    };

    const onPointerUp = () => {
      isMouseDown = false;
    };

    const onPointerOver = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      isInteractive =
        target.closest(
          "a, button, [role='button'], input, textarea, select, label, .clickable, .nav-link, .project-link, .cv-download-btn, .craft-card-primary-btn, .craft-card-secondary-btn, .lab-game-btn, .scroll-indicator, [data-cursor-interactive]"
        ) !== null;
    };

    const onMouseLeave = () => {
      isWindowHovered = false;
      setCustomCursorActive(false);
    };

    const onMouseEnter = (e: MouseEvent) => {
      if (isTouch || performance.now() - lastTouchTime < 700) return;
      updatePointerPos(e.clientX, e.clientY);
    };

    const onBlur = () => {
      isWindowHovered = false;
      isMouseDown = false;
      setCustomCursorActive(false);
    };

    const onTouchStart = () => {
      lastTouchTime = performance.now();
      isTouch = true;
      isWindowHovered = false;
      setCustomCursorActive(false);
    };

    const onTouchMove = () => {
      lastTouchTime = performance.now();
      isTouch = true;
      isWindowHovered = false;
      setCustomCursorActive(false);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointerover", onPointerOver, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);
    window.addEventListener("blur", onBlur);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      if (!cursorRef.current || !ringRef.current) return;

      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTime = now;

      // ── Opacity smoothing
      const targetOpacity = moved && isWindowHovered && !isTouch ? 1 : 0;
      const aOpacity = 1 - Math.exp(-12 * dt);
      currentOpacity += (targetOpacity - currentOpacity) * aOpacity;

      if (currentOpacity < 0.005) {
        cursorRef.current.style.opacity = "0";
        ringRef.current.style.opacity = "0";
        if (labelRef.current) labelRef.current.style.opacity = "0";
        return;
      }

      cursorRef.current.style.opacity = `${currentOpacity}`;
      ringRef.current.style.opacity = `${currentOpacity}`;

      // ── Ring follower physics
      const normalDiameter = 26;
      let targetRingX = mouseX;
      let targetRingY = mouseY;
      let targetRingW = normalDiameter;
      let stiffness = 280;
      let damping = 28;

      if (!scrollRootEl) {
        scrollRootEl = typeof document !== "undefined" ? document.querySelector(".scroll-root") : null;
      }
      const scrollTop = scrollRootEl ? scrollRootEl.scrollTop : (typeof window !== "undefined" ? window.scrollY : 0);
      const isHero = scrollTop < 100;

      const customWin = typeof window !== "undefined" ? (window as CustomWindow) : null;
      const bubbleHover = isHero && customWin ? customWin.bubbleHoverProgress || 0 : 0;
      const isBubbleHovered = isHero && customWin ? customWin.isBubbleHovered || false : false;
      const holdProgress = isHero && customWin ? customWin.bubbleHoldProgress || 0 : 0;
      const bubbleX = isHero && customWin ? customWin.bubbleX || 0 : 0;
      const bubbleY = isHero && customWin ? customWin.bubbleY || 0 : 0;

      const targetExpand = isBubbleHovered ? 1 : 0;
      const aExpand = 1 - Math.exp(-10 * dt);
      expandProgress += (targetExpand - expandProgress) * aExpand;

      const craftImageHovered = customWin ? customWin.__craftImageHovered || false : false;
      const targetCraftExpand = craftImageHovered ? 1 : 0;
      const aCraft = 1 - Math.exp(-10 * dt);
      craftImageExpand += (targetCraftExpand - craftImageExpand) * aCraft;

      if (isInteractive && craftImageExpand < 0.1) {
        targetRingW = isMouseDown ? 36 : 48;
        stiffness = 320;
        damping = 28;
      } else if (isMouseDown) {
        targetRingW = 20;
      } else if (craftImageExpand > 0.1) {
        targetRingW = 26 + craftImageExpand * 44;
        stiffness = 200;
        damping = 24;
      } else if (expandProgress > 0) {
        const vh = typeof window !== "undefined" ? window.innerHeight : 800;
        const bubbleDiameter = Math.min(vh * 0.44, 380);
        targetRingW = normalDiameter + expandProgress * (bubbleDiameter - normalDiameter);
        stiffness = 220 - expandProgress * 140;
        damping = 26 - expandProgress * 8;
      }

      if (bubbleHover > 0 && bubbleX > 0 && bubbleY > 0) {
        targetRingX = mouseX + (bubbleX - mouseX) * bubbleHover * 0.85;
        targetRingY = mouseY + (bubbleY - mouseY) * bubbleHover * 0.85;
      }

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

      const aSizeRing = 1 - Math.exp(-14 * dt);
      rw += (targetRingW - rw) * aSizeRing;

      ringRef.current.style.width = `${rw}px`;
      ringRef.current.style.height = `${rw}px`;
      ringRef.current.style.transform = `translate3d(${rx - rw / 2}px, ${ry - rw / 2}px, 0)`;

      if (craftImageExpand > 0.3) {
        ringRef.current.classList.add("is-craft-image");
      } else {
        ringRef.current.classList.remove("is-craft-image");
      }

      if (isInteractive) {
        ringRef.current.classList.add("is-hovered");
      } else {
        ringRef.current.classList.remove("is-hovered");
      }

      const dotEl = cursorRef.current?.querySelector(".cursor-dot") as HTMLElement | null;
      if (dotEl) {
        dotEl.style.opacity = craftImageExpand > 0.2 ? `${1 - craftImageExpand}` : "1";
        if (isMouseDown) {
          dotEl.style.transform = "scale(0.8)";
        } else {
          dotEl.style.transform = "scale(1)";
        }
      }

      if (labelRef.current && progressRef.current) {
        if (holdProgress > 0.01) {
          labelRef.current.style.opacity = "1";
          labelRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY + 28}px, 0)`;
          progressRef.current.style.transform = `scaleX(${holdProgress})`;
        } else {
          labelRef.current.style.opacity = "0";
          progressRef.current.style.transform = "scaleX(0)";
        }
      }
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      setCustomCursorActive(false);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" style={{ opacity: 0 }} aria-hidden="true" />
      <div ref={cursorRef} className="custom-cursor" style={{ opacity: 0 }} aria-hidden="true">
        <div className="cursor-dot" />
      </div>
      <div ref={labelRef} className="cursor-label" style={{ opacity: 0 }} aria-hidden="true">
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
