"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  points: number;
  alive: boolean;
}

const BRICK_ROWS = 4;
const BRICK_COLS = 8;
const ROW_COLORS = ["#e2e8f0", "#94a3b8", "#38bdf8", "#818cf8"];

export default function LabPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover" | "win">("idle");

  // Game internal state held in refs for 60/120fps RAF loop
  const paddleRef = useRef({ x: 0, y: 0, width: 90, height: 10, targetX: 0 });
  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, radius: 5.5, stuck: true });
  const bricksRef = useRef<Brick[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const animationFrameRef = useRef<number | null>(null);
  const canvasSizeRef = useRef({ width: 640, height: 480 });

  // Load high score from localStorage safely on mount
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem("lab_breakout_high_score");
        if (saved) {
          const val = parseInt(saved, 10);
          if (!isNaN(val)) setHighScore(val);
        }
      } catch {}
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Initialize Bricks
  const initBricks = useCallback((w: number) => {
    const bricks: Brick[] = [];
    const padding = 8;
    const topOffset = 48;
    const availableWidth = w - padding * (BRICK_COLS + 1);
    const brickWidth = availableWidth / BRICK_COLS;
    const brickHeight = 16;

    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        const x = padding + c * (brickWidth + padding);
        const y = topOffset + r * (brickHeight + padding);
        bricks.push({
          x,
          y,
          width: brickWidth,
          height: brickHeight,
          color: ROW_COLORS[r % ROW_COLORS.length],
          points: (BRICK_ROWS - r) * 10,
          alive: true,
        });
      }
    }
    bricksRef.current = bricks;
  }, []);

  // Spawn particle explosion
  const spawnParticles = (x: number, y: number, color: string) => {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 2 + 1,
        color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02,
      });
    }
  };

  // Reset ball onto paddle
  const resetBall = useCallback(() => {
    const { width, height } = canvasSizeRef.current;
    const paddle = paddleRef.current;
    paddle.width = Math.max(70, Math.min(100, width * 0.16));
    paddle.x = width / 2 - paddle.width / 2;
    paddle.y = height - 26;
    paddle.targetX = paddle.x;

    ballRef.current = {
      x: width / 2,
      y: paddle.y - 8,
      vx: 0,
      vy: 0,
      radius: 5.5,
      stuck: true,
    };
  }, []);

  // Launch ball
  const launchBall = () => {
    if (!ballRef.current.stuck) return;
    const speed = 5.2;
    const angle = (Math.random() * 0.5 - 0.25) * Math.PI - Math.PI / 2; // -60 to -120 deg
    ballRef.current.vx = Math.sin(angle) * speed;
    ballRef.current.vy = -Math.abs(Math.cos(angle) * speed);
    ballRef.current.stuck = false;
    setGameState("playing");
  };

  // Start fresh game
  const startGame = useCallback(() => {
    const { width } = canvasSizeRef.current;
    initBricks(width);
    resetBall();
    particlesRef.current = [];
    setScore(0);
    setLives(3);
    setGameState("idle");
  }, [initBricks, resetBall]);

  // Sync canvas dimensions to CSS bounding rect with Retina DPR
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);

    if (w === 0 || h === 0) return;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvasSizeRef.current = { width: w, height: h };

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    if (bricksRef.current.length === 0) {
      initBricks(w);
      resetBall();
    } else {
      // Re-adjust paddle Y & bricks X on resize
      paddleRef.current.y = h - 26;
      if (ballRef.current.stuck) {
        ballRef.current.y = paddleRef.current.y - 8;
        ballRef.current.x = paddleRef.current.x + paddleRef.current.width / 2;
      }
    }
  }, [initBricks, resetBall]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keysRef.current.left = true;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keysRef.current.right = true;
      } else if (e.key === " " || e.key === "Enter") {
        if (ballRef.current.stuck) launchBall();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keysRef.current.left = false;
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keysRef.current.right = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Pointer & Touch handlers
  const handlePointerMove = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const { width } = canvasSizeRef.current;
    const paddle = paddleRef.current;
    paddle.targetX = Math.max(0, Math.min(width - paddle.width, x - paddle.width / 2));
  };

  // Main RAF Game Loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const { width, height } = canvasSizeRef.current;
      const paddle = paddleRef.current;
      const ball = ballRef.current;

      // ── 1. Update Paddle with Keyboard & Lerp ──
      const keySpeed = 500 * dt;
      if (keysRef.current.left) {
        paddle.targetX = Math.max(0, paddle.targetX - keySpeed);
      }
      if (keysRef.current.right) {
        paddle.targetX = Math.min(width - paddle.width, paddle.targetX + keySpeed);
      }
      // Smooth lerp
      paddle.x += (paddle.targetX - paddle.x) * (1 - Math.exp(-22 * dt));

      // ── 2. Update Ball ──
      if (ball.stuck) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = paddle.y - ball.radius - 2;
      } else {
        ball.x += ball.vx * 60 * dt;
        ball.y += ball.vy * 60 * dt;

        // Wall collisions
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx);
        } else if (ball.x + ball.radius >= width) {
          ball.x = width - ball.radius;
          ball.vx = -Math.abs(ball.vx);
        }

        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
        }

        // Paddle Collision
        if (
          ball.y + ball.radius >= paddle.y &&
          ball.y - ball.radius <= paddle.y + paddle.height &&
          ball.x >= paddle.x - 4 &&
          ball.x <= paddle.x + paddle.width + 4 &&
          ball.vy > 0
        ) {
          // Calculate dynamic bounce angle based on hit location
          const hitOffset = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
          const maxAngle = (70 * Math.PI) / 180;
          const bounceAngle = hitOffset * maxAngle;
          const currentSpeed = Math.min(
            8.5,
            Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 1.02
          );

          ball.vx = currentSpeed * Math.sin(bounceAngle);
          ball.vy = -currentSpeed * Math.cos(bounceAngle);
          ball.y = paddle.y - ball.radius;

          // Paddle hit micro-particles
          for (let i = 0; i < 4; i++) {
            particlesRef.current.push({
              x: ball.x,
              y: paddle.y,
              vx: (Math.random() - 0.5) * 3,
              vy: -Math.random() * 2 - 1,
              radius: 1.5,
              color: "#ffffff",
              alpha: 0.8,
              decay: 0.05,
            });
          }
        }

        // Brick Collisions
        let remainingBricks = 0;
        for (const brick of bricksRef.current) {
          if (!brick.alive) continue;
          remainingBricks++;

          // AABB collision detection
          if (
            ball.x + ball.radius >= brick.x &&
            ball.x - ball.radius <= brick.x + brick.width &&
            ball.y + ball.radius >= brick.y &&
            ball.y - ball.radius <= brick.y + brick.height
          ) {
            brick.alive = false;
            remainingBricks--;

            // Determine collision edge
            const prevX = ball.x - ball.vx * 60 * dt;

            if (prevX < brick.x || prevX > brick.x + brick.width) {
              ball.vx = -ball.vx;
            } else {
              ball.vy = -ball.vy;
            }

            spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);

            // Update score
            setScore((prev) => {
              const next = prev + brick.points;
              setHighScore((prevHigh) => {
                if (next > prevHigh) {
                  try {
                    localStorage.setItem("lab_breakout_high_score", next.toString());
                  } catch {}
                  return next;
                }
                return prevHigh;
              });
              return next;
            });
            break;
          }
        }

        // Win condition
        if (remainingBricks === 0 && bricksRef.current.length > 0) {
          setGameState("win");
          ball.stuck = true;
        }

        // Ball drop below screen (Loss of life)
        if (ball.y - ball.radius > height) {
          setLives((prevLives) => {
            const nextLives = prevLives - 1;
            if (nextLives <= 0) {
              setGameState("gameover");
              ball.stuck = true;
            } else {
              resetBall();
            }
            return nextLives;
          });
        }
      }

      // ── 3. Render Canvas ──
      ctx.clearRect(0, 0, width, height);

      // Background subtle grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Render Bricks
      for (const brick of bricksRef.current) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.color;
        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Render Paddle
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Render Ball
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "rgba(56, 189, 248, 0.7)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [resetBall]);

  return (
    <>
      {/* Fixed Navbar wrapper */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          pointerEvents: "none",
          ["--scroll-progress" as string]: 1,
        } as React.CSSProperties}
      >
        <div style={{ pointerEvents: "auto" }}>
          <Navbar />
        </div>
      </div>

      <div className="subpage-root lab-page-root">
        {/* Page Header: Just "COMING SOON" */}
        <header className="cv-header" style={{ marginBottom: "28px" }}>
          <div className="cv-header-left">
            <h1 className="cv-title">COMING SOON</h1>
          </div>
        </header>

        {/* Minimal Breakout Game */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lab-game-minimal"
        >
          {/* Subtle minimal HUD */}
          <div className="lab-minimal-hud">
            <div className="lab-hud-item">
              <span className="lab-hud-key">SCORE</span>
              <span className="lab-hud-val">{score}</span>
            </div>
            <div className="lab-hud-item">
              <span className="lab-hud-key">BEST</span>
              <span className="lab-hud-val">{highScore}</span>
            </div>
            <div className="lab-hud-item">
              <span className="lab-hud-key">LIVES</span>
              <div className="lab-hud-lives">
                {[...Array(3)].map((_, i) => (
                  <span
                    key={i}
                    className={`lab-hud-heart ${i < lives ? "active" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Borderless / Minimal Canvas Viewport */}
          <div
            ref={containerRef}
            className="lab-canvas-viewport"
            onClick={launchBall}
            onPointerMove={(e) => handlePointerMove(e.clientX)}
            onTouchMove={(e) => {
              if (e.touches.length > 0) {
                handlePointerMove(e.touches[0].clientX);
              }
            }}
          >
            <canvas ref={canvasRef} className="lab-game-canvas" />

            {/* Idle Overlay: Minimal PLAY button */}
            {gameState === "idle" && (
              <div className="lab-game-overlay">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    launchBall();
                  }}
                  className="lab-game-btn"
                >
                  PLAY
                </button>
              </div>
            )}

            {/* Game Over Overlay */}
            {gameState === "gameover" && (
              <div className="lab-game-overlay">
                <span className="lab-game-overlay-title">GAME OVER</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                    launchBall();
                  }}
                  className="lab-game-btn"
                >
                  PLAY AGAIN
                </button>
              </div>
            )}

            {/* Victory Overlay */}
            {gameState === "win" && (
              <div className="lab-game-overlay">
                <span className="lab-game-overlay-title">CLEARED</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                    launchBall();
                  }}
                  className="lab-game-btn"
                >
                  PLAY AGAIN
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
