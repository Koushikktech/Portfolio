"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Text,
  Float,
  MeshTransmissionMaterial,
  Environment,
  Line,
} from "@react-three/drei";
import * as THREE from "three";


/* ────────────────────────────────────────────────────────
   Shared interaction state (mutable ref, no re-renders)
   ──────────────────────────────────────────────────────── */
interface InteractionData {
  mouseX: number;
  mouseY: number;
  bubbleX: number;
  bubbleY: number;
  distance: number;
  isNear: boolean;
  isHovered: boolean;
  hoverProgress: number; // 0 → 1  (magnetic edge → bubble edge)
  smoothHoverProgress: number; // smoothed version for rendering
  isMouseDown: boolean;
  holdProgress: number;
  isPopped: boolean;
  hasMoved: boolean; // true once the real mouse has moved at least once
  isInteractive: boolean; // true when hovering over links/buttons or pointer cursor elements
}

/* ────────────────────────────────────────────────────────
   BubbleMesh — vertex deformation + material morphing
   ──────────────────────────────────────────────────────── */
interface BubbleMeshProps {
  interactionRef: React.MutableRefObject<InteractionData>;
}

function BubbleMesh({ interactionRef }: BubbleMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const smoothHover = useRef(0);
  const smoothPop = useRef(0);
  const isPoppedState = useRef(false);
  const reformTimer = useRef(0);
  const smoothMouseDir = useRef(new THREE.Vector3(0, 0, 1)); // smoothed ripple direction

  // Persistent vectors to avoid per-frame allocations (GC pressure)
  const _vecV = useRef(new THREE.Vector3());
  const _vecRawDir = useRef(new THREE.Vector3());
  const _vecBpos = useRef(new THREE.Vector3());
  const _vecTn = useRef(new THREE.Vector3());
  // Cached DOM element
  const scrollRootRef = useRef<Element | null>(null);

  const originalPositions = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.85, 48);
    return geo.attributes.position.clone();
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05); // cap to prevent large jumps on tab-switch

    /* ── 1. Project bubble center → screen coords ── */
    if (groupRef.current) {
      const v = _vecV.current.set(0, 0, 0);
      groupRef.current.getWorldPosition(v);
      v.project(state.camera);

      const sx = (v.x * 0.5 + 0.5) * state.size.width;
      const sy = (-v.y * 0.5 + 0.5) * state.size.height;

      interactionRef.current.bubbleX = sx;
      interactionRef.current.bubbleY = sy;

      const dx = interactionRef.current.mouseX - sx;
      const dy = interactionRef.current.mouseY - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      interactionRef.current.distance = dist;

      // Radii — magnetic zone starts beyond the bubble visual edge
      const vh = state.size.height;
      const hoverR = vh * 0.15; // bubble hover zone (visual edge + small buffer)
      const magnetR = vh * 0.45; // generous magnetic field for fluid approach feel

      // Disable bubble interactions when scrolled away to Craft section
      if (!scrollRootRef.current && typeof document !== "undefined") {
        scrollRootRef.current = document.querySelector(".scroll-root");
      }
      const scrollTop = scrollRootRef.current ? scrollRootRef.current.scrollTop : 0;
      const isHero = scrollTop < 100;

      const near = isHero && dist < magnetR && interactionRef.current.hasMoved;
      const hovered =
        isHero && dist < hoverR && interactionRef.current.hasMoved;

      interactionRef.current.isNear = near;
      interactionRef.current.isHovered = hovered;

      if (near) {
        const raw =
          1 - Math.max(0, Math.min(1, (dist - hoverR) / (magnetR - hoverR)));
        // Ease-out curve for silky feel
        interactionRef.current.hoverProgress = raw * raw * (3 - 2 * raw);
      } else {
        interactionRef.current.hoverProgress = 0;
      }
    }

    const targetHover = interactionRef.current.hoverProgress;

    /* ── 2. Exponential smoothing (buttery interpolation) ── */
    // Approach: smooth = smooth + (target - smooth) * (1 - e^(-speed * dt))
    const smoothingSpeed = 6.0; // higher = snappier, 6 = silky
    const alpha = 1 - Math.exp(-smoothingSpeed * dt);
    smoothHover.current += (targetHover - smoothHover.current) * alpha;
    interactionRef.current.smoothHoverProgress = smoothHover.current;

    // Write hover progress, hold progress, and bubble coordinates to window for CustomCursor synchronization
    if (typeof window !== "undefined") {
      (window as any).bubbleHoverProgress = smoothHover.current;
      (window as any).bubbleHoldProgress = interactionRef.current.holdProgress;
      (window as any).isBubbleHovered = interactionRef.current.isHovered;
      (window as any).bubbleX = interactionRef.current.bubbleX;
      (window as any).bubbleY = interactionRef.current.bubbleY;
    }

    /* ── 3. Hold-to-pop ── */
    const { isMouseDown } = interactionRef.current;
    if (
      interactionRef.current.isHovered &&
      isMouseDown &&
      !isPoppedState.current
    ) {
      interactionRef.current.holdProgress = Math.min(
        1,
        interactionRef.current.holdProgress + dt / 0.8,
      );
      if (interactionRef.current.holdProgress >= 1) {
        isPoppedState.current = true;
        interactionRef.current.isPopped = true;
        interactionRef.current.holdProgress = 0;
        reformTimer.current = 0;
      }
    } else {
      interactionRef.current.holdProgress = Math.max(
        0,
        interactionRef.current.holdProgress - dt * 3,
      );
    }

    /* ── 4. Pop / reform ── */
    if (isPoppedState.current) {
      smoothPop.current += (1 - smoothPop.current) * alpha * 3;
      if (smoothPop.current > 0.97) {
        reformTimer.current += dt;
        if (reformTimer.current > 1.5) {
          isPoppedState.current = false;
          interactionRef.current.isPopped = false;
        }
      }
    } else {
      smoothPop.current += (0 - smoothPop.current) * alpha * 0.8;
    }

    /* ── 5. Floating (calmed on hover) ── */
    if (groupRef.current) {
      const calm = 1 - smoothHover.current * 0.5;
      groupRef.current.position.x =
        (Math.sin(time * 0.3) * 0.08 + Math.sin(time * 0.17) * 0.04) * calm;
      groupRef.current.position.y = (Math.cos(time * 0.25) * 0.06 + 0.1) * calm;
      groupRef.current.position.z = 0.5 + Math.sin(time * 0.2) * 0.05;

      groupRef.current.rotation.x = Math.sin(time * 0.15) * 0.3;
      groupRef.current.rotation.y = time * 0.08;
      groupRef.current.rotation.z = Math.cos(time * 0.12) * 0.15;
    }

    if (!meshRef.current) return;
    const positions = meshRef.current.geometry.attributes.position;

    /* ── 6. Mouse direction in world space (smoothed) ── */
    if (groupRef.current) {
      const bpos = _vecBpos.current.set(0, 0, 0);
      groupRef.current.getWorldPosition(bpos);
      const vp = state.viewport.getCurrentViewport(state.camera, bpos);
      const rawDir = _vecRawDir.current.set(
        (state.pointer.x * vp.width) / 2,
        (state.pointer.y * vp.height) / 2,
        bpos.z,
      )
        .sub(bpos)
        .normalize();

      // Lerp the direction vector for buttery smooth ripple movement
      const dirAlpha = 1 - Math.exp(-4.0 * dt);
      smoothMouseDir.current.lerp(rawDir, dirAlpha).normalize();
    }
    const toMouseDir = smoothMouseDir.current;

    const rot = groupRef.current
      ? groupRef.current.rotation
      : new THREE.Euler();
    const tn = _vecTn.current;

    /* ── 7. Vertex deformation ── */
    for (let i = 0; i < positions.count; i++) {
      const ox = originalPositions.getX(i);
      const oy = originalPositions.getY(i);
      const oz = originalPositions.getZ(i);

      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx = ox / len;
      const ny = oy / len;
      const nz = oz / len;

      // Organic dimples — dampen amplitude on hover for a cleaner surface
      const dimpleDampen = 1 - smoothHover.current * 0.45;
      const df =
        (Math.sin(nx * 6.5 + ny * 3.5 + time * 0.6) * 0.4 +
          Math.cos(ny * 7.5 - nz * 5.0 + time * 0.5) * 0.4 +
          Math.sin(nz * 8.5 + nx * 2.5 - time * 0.55) * 0.35 +
          Math.cos(nx * 5.5 - ny * 7.0 + time * 0.45) * 0.3 +
          Math.sin(nx * 10.0 + nz * 6.0 + time * 0.4) * 0.25 +
          Math.cos(ny * 12.0 + nx * 4.5 - time * 0.35) * 0.2) *
        dimpleDampen;

      tn.set(nx, ny, nz).applyEuler(rot);
      const wNz = tn.z;
      const fade = Math.pow(Math.max(0, wNz), 1.2);

      let disp = 0;
      if (df < 0) {
        disp = -Math.pow(-df, 1.05) * 0.24 * fade;
      } else {
        disp = Math.pow(df, 1.05) * 0.055;
      }

      const breath =
        Math.sin(nx * 5.0 + time * 0.8) * 0.003 +
        Math.cos(ny * 4.5 - time * 0.7) * 0.003;

      // Liquid ripple toward cursor — broad, gentle bulge
      const dotM = tn.dot(toMouseDir);
      const ripple =
        Math.pow(Math.max(0, dotM), 1.8) * 0.055 * smoothHover.current;

      // Pop explosion
      const popD = Math.pow(smoothPop.current, 2.0) * 3.0;

      const total = (disp + breath + ripple) * (1 - smoothPop.current) + popD;

      positions.setXYZ(i, ox + nx * total, oy + ny * total, oz + nz * total);
    }

    positions.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();

    /* ── 8. Material morphing ── */
    const mat = meshRef.current.material as any;
    if (mat) {
      const h = smoothHover.current;
      mat.ior = THREE.MathUtils.lerp(1.05, 1.15, h);
      mat.thickness = THREE.MathUtils.lerp(0.03, 0.12, h);
      mat.chromaticAberration = THREE.MathUtils.lerp(0.03, 0.14, h);
      mat.distortion = THREE.MathUtils.lerp(0.15, 0.45, h);
      mat.distortionScale = THREE.MathUtils.lerp(0.2, 0.5, h);
      mat.iridescence = THREE.MathUtils.lerp(0.35, 0.85, h);

      // Subtle lavender tint on hover to signal "selected"
      const r = THREE.MathUtils.lerp(0.98, 0.88, h);
      const g = THREE.MathUtils.lerp(0.969, 0.82, h);
      const b = THREE.MathUtils.lerp(1.0, 0.98, h);
      (mat.color as THREE.Color).setRGB(r, g, b);

      // Pop fadeout
      mat.transmission = THREE.MathUtils.lerp(1, 0, smoothPop.current);
      mat.opacity = THREE.MathUtils.lerp(1, 0, smoothPop.current);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.1, 0.5]}>
      <Float speed={0.8} rotationIntensity={0.02} floatIntensity={0.03}>
        <mesh ref={meshRef}>
          <icosahedronGeometry args={[0.8, 48]} />
          <MeshTransmissionMaterial
            backside={false}
            samples={8}
            resolution={1024}
            transmission={1.0}
            roughness={0.0}
            clearcoat={1.0}
            clearcoatRoughness={0.0}
            thickness={0.03}
            ior={1.05}
            chromaticAberration={0.03}
            anisotropy={0.2}
            distortion={0.15}
            distortionScale={0.2}
            temporalDistortion={0.0}
            color="#faf7ff"
            attenuationColor="#f3e8ff"
            attenuationDistance={100}
            iridescence={0.35}
            iridescenceIOR={1.5}
            iridescenceThicknessRange={[100, 400]}
            toneMapped={false}
            transparent={true}
          />
        </mesh>
      </Float>
    </group>
  );
}

/* ─── 3D Text (responsive) ─── */
function SceneText() {
  const { viewport } = useThree();
  // Scale text based on viewport width; desktop ~5.5+ units, mobile ~2.5
  const scale = Math.min(1, viewport.width / 5.5);

  return (
    <group scale={[scale, scale, 1]}>
      <Text
        position={[0, 0.42, -0.5]}
        fontSize={0.14}
        color="#a1a1aa"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.13}
        font="/fonts/Inter-Regular.woff"
      >
        Full-Stack Engineer • AI Automation
      </Text>
      <Text
        position={[0, -0.1, -0.5]}
        fontSize={1.0}
        color="#18181b"
        anchorX="center"
        anchorY="middle"
        letterSpacing={-0.03}
        font="/fonts/Inter-Bold.woff"
      >
        Koushikk
      </Text>
    </group>
  );
}

/* ─── Background Lines ─── */
function BackgroundLines() {
  return (
    <group position={[0, 0, -5]}>
      <Line
        points={[new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, -10, 0)]}
        color="#18181b"
        lineWidth={1.0}
        dashed={true}
        dashSize={0.15}
        dashScale={1}
        gapSize={0.1}
        transparent
        opacity={0.07}
      />
      <mesh position={[-4, 0, 0]}>
        <planeGeometry args={[0.015, 20]} />
        <meshBasicMaterial color="#18181b" transparent opacity={0.03} />
      </mesh>
      <mesh position={[4, 0, 0]}>
        <planeGeometry args={[0.015, 20]} />
        <meshBasicMaterial color="#18181b" transparent opacity={0.03} />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <planeGeometry args={[20, 0.015]} />
        <meshBasicMaterial color="#18181b" transparent opacity={0.03} />
      </mesh>
    </group>
  );
}

/* ─── Background Gradient Plane ─── */
function BackgroundGradient() {
  return (
    <mesh position={[0, 0, -8]} scale={[25, 25, 1]}>
      <planeGeometry />
      <shaderMaterial
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          void main() {
            vec2 uv = vUv - 0.5;
            float dist = length(uv) * 1.414;
            vec3 color1 = vec3(0.984, 0.976, 1.0);
            vec3 color2 = vec3(0.922, 0.875, 0.992);
            vec3 color = mix(color1, color2, smoothstep(0.0, 1.0, dist));
            gl_FragColor = vec4(color, 1.0);
          }
        `}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ────────────────────────────────────────────────────────
   HoverArc — circular spinning text around bubble
   ──────────────────────────────────────────────────────── */
function HoverArc({
  interactionRef,
}: {
  interactionRef: React.MutableRefObject<InteractionData>;
}) {
  const arcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    let currentOpacity = 0;
    let currentScale = 0.85;

    const tick = () => {
      const d = interactionRef.current;
      if (!d || !arcRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const targetOpacity = d.hasMoved ? d.smoothHoverProgress * 0.7 : 0;
      const targetScale = 0.85 + d.smoothHoverProgress * 0.15;

      // Smooth with exponential decay
      currentOpacity += (targetOpacity - currentOpacity) * 0.08;
      currentScale += (targetScale - currentScale) * 0.08;

      arcRef.current.style.opacity = `${currentOpacity}`;
      arcRef.current.style.transform = `translate3d(${d.bubbleX}px, ${d.bubbleY}px, 0) translate(-50%, -50%) scale(${currentScale})`;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [interactionRef]);

  return (
    <div ref={arcRef} className="hover-arc-container" style={{ opacity: 0 }}>
      <svg viewBox="0 0 200 200" className="hover-arc">
        <path
          id="circlePath"
          d="M 100, 100 m -82, 0 a 82,82 0 1,1 164,0 a 82,82 0 1,1 -164,0"
          fill="none"
        />
        <text
          fill="rgba(24, 24, 27, 0.4)"
          fontSize="7"
          fontWeight="500"
          letterSpacing="4.5"
        >
          <textPath href="#circlePath" startOffset="0%">
            CLICK TO TRANSITION • KOUSHIKK PORTFOLIO 2026 •
          </textPath>
        </text>
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   FluidBubble — root component
   ──────────────────────────────────────────────────────── */
export default function FluidBubble() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport once on mount
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const interactionRef = useRef<InteractionData>({
    mouseX: -9999, // offscreen so nothing triggers on load
    mouseY: -9999,
    bubbleX: 0,
    bubbleY: 0,
    distance: 9999,
    isNear: false,
    isHovered: false,
    hoverProgress: 0,
    smoothHoverProgress: 0,
    isMouseDown: false,
    holdProgress: 0,
    isPopped: false,
    hasMoved: false,
    isInteractive: false,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      interactionRef.current.mouseX = e.clientX;
      interactionRef.current.mouseY = e.clientY;
      interactionRef.current.hasMoved = true;
    };

    const onDown = () => {
      interactionRef.current.isMouseDown = true;
    };
    const onUp = () => {
      interactionRef.current.isMouseDown = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        interactionRef.current.mouseX = e.touches[0].clientX;
        interactionRef.current.mouseY = e.touches[0].clientY;
        interactionRef.current.hasMoved = true;
      }
    };
    const onTouchStart = () => {
      interactionRef.current.isMouseDown = true;
    };
    const onTouchEnd = () => {
      interactionRef.current.isMouseDown = false;
    };

    // Detect if hovering over clickable elements (links, buttons, or custom cursor:pointer elements)
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isClickable =
        target.closest("a, button, [role='button']") !== null ||
        window.getComputedStyle(target).cursor === "pointer";
      interactionRef.current.isInteractive = isClickable;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("mouseover", onOver);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("mouseover", onOver);

      if (typeof window !== "undefined") {
        (window as any).bubbleHoverProgress = 0;
        (window as any).bubbleHoldProgress = 0;
      }
    };
  }, []);

  // Control cursor visibility via direct DOM mutation (avoids React re-renders every frame)
  useEffect(() => {
    let raf: number;
    const check = () => {
      if (containerRef.current) {
        containerRef.current.style.cursor = interactionRef.current.hasMoved ? "none" : "auto";
      }
      raf = requestAnimationFrame(check);
    };
    raf = requestAnimationFrame(check);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: isMobile ? 52 : 40 }}
        gl={{ alpha: true, antialias: !isMobile }}
        style={{ position: "absolute", inset: 0 }}
        dpr={isMobile ? [1, 1] : [1, 2]}
      >
        <BackgroundGradient />
        <BackgroundLines />

        <Environment preset="studio" environmentIntensity={2.0} />
        <ambientLight intensity={0.5} color="#faf5ff" />
        <directionalLight
          position={[0.2, 0.2, 6]}
          intensity={3.0}
          color="#ffffff"
        />
        <directionalLight
          position={[3, 10, 5]}
          intensity={3.5}
          color="#ffffff"
        />
        <directionalLight
          position={[-6, 4, 3]}
          intensity={1.5}
          color="#f5eefd"
        />
        <directionalLight
          position={[0, -5, 3]}
          intensity={0.8}
          color="#ebdffd"
        />
        <directionalLight
          position={[0, 3, -5]}
          intensity={0.8}
          color="#c09cff"
        />

        <SceneText />
        <BubbleMesh interactionRef={interactionRef} />
      </Canvas>

      {/* HTML Overlays — outside canvas, pointer-events: none */}
      <HoverArc interactionRef={interactionRef} />
    </div>
  );
}
