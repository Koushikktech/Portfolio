"use client";

import { useEffect, useRef, useCallback } from "react";

interface SnakeBootScreenProps {
  onComplete: () => void;
}

const COLS = 12;
const ROWS = 8;
const TOTAL_CELLS = COLS * ROWS;
const CELL_SIZE = 20;
const GAP = 2;
const CANVAS_WIDTH = COLS * CELL_SIZE + (COLS - 1) * GAP; // 262px
const CANVAS_HEIGHT = ROWS * CELL_SIZE + (ROWS - 1) * GAP; // 174px

// Duration in seconds — deliberate, cybernetic boot sequence
const DURATION_S = 2.8;

interface Point {
  x: number;
  y: number;
}

// Pre-compute serpentine path
const PATH: Point[] = [];
for (let y = 0; y < ROWS; y++) {
  if (y % 2 === 0) {
    for (let x = 0; x < COLS; x++) PATH.push({ x, y });
  } else {
    for (let x = COLS - 1; x >= 0; x--) PATH.push({ x, y });
  }
}

// Map grid index (y * COLS + x) -> path index
const GRID_TO_PATH = new Int16Array(TOTAL_CELLS).fill(-1);
PATH.forEach((pt, i) => {
  GRID_TO_PATH[pt.y * COLS + pt.x] = i;
});

/**
 * SnakeBootScreen — Ultra-lightweight batched Canvas 2D overlay
 */
export default function SnakeBootScreen({ onComplete }: SnakeBootScreenProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusTextRef = useRef<HTMLSpanElement>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleComplete = useCallback(() => {
    onCompleteRef.current();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Handle high-DPI crisp rendering
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    let lastTime = performance.now();
    let completed = false;
    let frameId: number;

    const SPEED = 100 / DURATION_S;
    let smoothProgress = 0;

    const animate = (now: number) => {
      if (completed) return;

      const rawDt = (now - lastTime) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTime = now;

      smoothProgress += SPEED * dt;

      // Update status text percentage with zero React re-renders
      if (statusTextRef.current) {
        const pct = Math.min(100, Math.floor(smoothProgress));
        statusTextRef.current.textContent =
          pct < 100 ? `INITIALIZING SYSTEM... ${pct}%` : "SYSTEM READY";
      }

      // ── Snake calculations ──
      const t = Math.min(1, smoothProgress / 100);
      const headIdx = Math.floor(t * (PATH.length - 1));
      const maxLen = 22;
      const snakeLen = Math.max(3, Math.round(t * (maxLen - 3)) + 3);
      const tailIdx = Math.max(0, headIdx - snakeLen + 1);
      const segmentCount = headIdx - tailIdx + 1;

      // ── Single batched Canvas Draw ──
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Pass 1: Inactive background grid cells in a single path
      ctx.beginPath();
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cellIndex = r * COLS + c;
          const pathIdx = GRID_TO_PATH[cellIndex];
          if (pathIdx < tailIdx || pathIdx > headIdx) {
            const x = c * (CELL_SIZE + GAP);
            const y = r * (CELL_SIZE + GAP);
            ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 3);
          }
        }
      }
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pass 2: Snake cells with smooth alpha gradient
      for (let pIdx = tailIdx; pIdx <= headIdx; pIdx++) {
        const pt = PATH[pIdx];
        if (!pt) continue;
        const x = pt.x * (CELL_SIZE + GAP);
        const y = pt.y * (CELL_SIZE + GAP);

        const relPos = segmentCount > 1 ? (pIdx - tailIdx) / (segmentCount - 1) : 1;
        const opacity = 0.15 + Math.pow(relPos, 2.0) * 0.85;

        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + relPos * 0.7})`;

        ctx.beginPath();
        ctx.roundRect(x, y, CELL_SIZE, CELL_SIZE, 3);
        ctx.fill();
        ctx.stroke();
      }

      // ── Completion trigger ──
      if (smoothProgress >= 99.5 && !completed) {
        completed = true;
        if (statusTextRef.current) {
          statusTextRef.current.textContent = "SYSTEM READY";
        }
        setTimeout(() => {
          overlayRef.current?.classList.add("fade-out");
          setTimeout(() => handleComplete(), 550);
        }, 220);
        return;
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [handleComplete]);

  // Click or touch to skip boot animation immediately
  const handleQuickSkip = () => {
    overlayRef.current?.classList.add("fade-out");
    setTimeout(() => handleComplete(), 300);
  };

  return (
    <div
      ref={overlayRef}
      className="snake-screen-overlay"
      onClick={handleQuickSkip}
      title="Click anywhere to skip"
    >
      <div className="snake-loader-container">
        <div
          className="snake-grid"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: `${CANVAS_WIDTH}px`,
              height: `${CANVAS_HEIGHT}px`,
              display: "block",
            }}
          />
        </div>

        <div className="loader-info">
          <span ref={statusTextRef} className="status-text">INITIALIZING SYSTEM... 0%</span>
          <span style={{ fontSize: "9px", opacity: 0.6 }}>TAP TO SKIP</span>
        </div>
      </div>
    </div>
  );
}
