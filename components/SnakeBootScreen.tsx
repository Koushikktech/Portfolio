"use client";

import { useEffect, useRef, useCallback } from "react";

interface SnakeBootScreenProps {
  onComplete: () => void;
}

const PROJECT_IMAGES = [
  "/projects/project1.png",
  "/projects/project2.png",
  "/projects/project3.png",
];

const COLS = 12;
const ROWS = 8;
const TOTAL_CELLS = COLS * ROWS;

// Constant speed: the snake takes this many seconds to travel 0→100%
const DURATION_S = 3.2;

interface Point {
  x: number;
  y: number;
}

// Pre-compute the serpentine path once at module level
const PATH: Point[] = [];
for (let y = 0; y < ROWS; y++) {
  if (y % 2 === 0) {
    for (let x = 0; x < COLS; x++) PATH.push({ x, y });
  } else {
    for (let x = COLS - 1; x >= 0; x--) PATH.push({ x, y });
  }
}

// Pre-compute a flat lookup: grid index (row * COLS + col) → path index
const GRID_TO_PATH = new Int16Array(TOTAL_CELLS).fill(-1);
PATH.forEach((pt, i) => {
  GRID_TO_PATH[pt.y * COLS + pt.x] = i;
});

export default function SnakeBootScreen({ onComplete }: SnakeBootScreenProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleComplete = useCallback(() => {
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cells = grid.querySelectorAll<HTMLDivElement>(".grid-cell");
    if (cells.length !== TOTAL_CELLS) return;

    // ── Mutable animation state ──
    let lastTime = performance.now();
    const startTime = performance.now();
    let completed = false;
    let frameId: number;
    let assetsReady = false;

    // Constant linear speed — units per second
    const SPEED = 100 / DURATION_S;
    let smoothProgress = 0;

    const animate = (now: number) => {
      if (completed) return;

      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTime = now;

      // Constant speed — same pace from start to finish
      // Cap at 95% if assets haven't loaded yet, so it waits gracefully
      const ceiling = assetsReady ? 100 : 95;
      if (smoothProgress < ceiling) {
        smoothProgress += SPEED * dt;
        smoothProgress = Math.min(smoothProgress, ceiling);
      }

      // ── Derive snake geometry ──
      const t = smoothProgress / 100;
      const headIdx = Math.floor(t * (PATH.length - 1));
      const maxLen = 24;
      const snakeLen = Math.max(2, Math.round(t * (maxLen - 2)) + 2);
      const tailIdx = Math.max(0, headIdx - snakeLen + 1);
      const segmentCount = headIdx - tailIdx + 1;

      // ── Paint every cell in a single pass ──
      for (let i = 0; i < TOTAL_CELLS; i++) {
        const pathIdx = GRID_TO_PATH[i];
        const cell = cells[i];

        if (pathIdx >= tailIdx && pathIdx <= headIdx) {
          const relPos =
            segmentCount > 1
              ? (pathIdx - tailIdx) / (segmentCount - 1)
              : 1;
          const opacity = 0.08 + Math.pow(relPos, 2.2) * 0.92;

          cell.style.opacity = String(opacity);
          cell.style.background = "#ffffff";
          cell.style.borderColor = `rgba(255,255,255,${0.3 + relPos * 0.7})`;

          if (pathIdx === headIdx) {
            cell.style.boxShadow =
              "0 0 12px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.5)";
          } else {
            const glowStrength = relPos * 0.5;
            cell.style.boxShadow = `0 0 ${6 * glowStrength}px rgba(255,255,255,${glowStrength * 0.6})`;
          }
        } else {
          cell.style.opacity = "1";
          cell.style.background = "rgba(255,255,255,0.015)";
          cell.style.borderColor = "rgba(255,255,255,0.03)";
          cell.style.boxShadow = "none";
        }
      }

      // ── Completion ──
      if (smoothProgress >= 99.5 && !completed) {
        completed = true;

        setTimeout(() => {
          overlayRef.current?.classList.add("fade-out");
          setTimeout(() => handleComplete(), 600);
        }, 400);
        return;
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    // ── Asset Preloader (runs silently in background) ──
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready
        .then(() => {})
        .catch(() => {});
    }

    let loaded = 0;
    const total = PROJECT_IMAGES.length;
    PROJECT_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
      const done = () => {
        loaded++;
        if (loaded === total) {
          assetsReady = true;
        }
      };
      img.onload = done;
      img.onerror = done;
    });

    // Fallback: if assets somehow take too long, unlock after 8s
    const fallbackTimer = setTimeout(() => {
      assetsReady = true;
    }, 8000);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(fallbackTimer);
    };
  }, [handleComplete]);

  return (
    <div ref={overlayRef} className="snake-screen-overlay">
      <div className="snake-loader-container">
        <div ref={gridRef} className="snake-grid">
          {Array.from({ length: ROWS }).map((_, r) => (
            <div key={r} className="grid-row">
              {Array.from({ length: COLS }).map((_, c) => (
                <div
                  key={c}
                  className="grid-cell"
                  style={{
                    animationDelay: `${(r * COLS + c) * 12}ms`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="loader-info">
          <span className="status-text">Loading..</span>
        </div>
      </div>
    </div>
  );
}

