"use client";

import React, { useRef, useMemo, useEffect, useState, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Text,
  Float,
  MeshTransmissionMaterial,
  Environment,
  Line,
} from "@react-three/drei";
import * as THREE from "three";
import { DeviceTier } from "@/lib/deviceTier";

interface CustomWindow extends Window {
  bubbleHoverProgress?: number;
  bubbleHoldProgress?: number;
  isBubbleHovered?: boolean;
  bubbleX?: number;
  bubbleY?: number;
  __craftImageHovered?: boolean;
}

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
  hoverProgress: number;
  smoothHoverProgress: number;
  isMouseDown: boolean;
  holdProgress: number;
  isPopped: boolean;
  hasMoved: boolean;
  isInteractive: boolean;
}

interface BubbleMeshProps {
  interactionRef: React.MutableRefObject<InteractionData>;
  isVisible: boolean;
  tier: DeviceTier;
}

function BubbleMesh({ interactionRef, isVisible, tier }: BubbleMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const smoothHover = useRef(0);
  const smoothPop = useRef(0);
  const isPoppedState = useRef(false);
  const reformTimer = useRef(0);
  const smoothMouseDir = useRef(new THREE.Vector3(0, 0, 1));

  // Persistent vectors to avoid per-frame allocations
  const _vecV = useRef(new THREE.Vector3());
  const _vecRawDir = useRef(new THREE.Vector3());
  const _vecBpos = useRef(new THREE.Vector3());
  const _vecTn = useRef(new THREE.Vector3());

  const scrollRootRef = useRef<Element | null>(null);

  // Smooth UV Sphere Geometry: 64 width segments × 48 height segments = 3,185 vertices
  // Pre-deformed at construction time so it is NEVER rendered as a raw sphere
  const { geometry, originalPositions, baseNormals, count } = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.85, 64, 48);
    const pos = geo.attributes.position;
    const vertexCount = pos.count;
    const orig = new Float32Array(vertexCount * 3);
    const norms = new Float32Array(vertexCount * 3);
    const posArray = pos.array as Float32Array;

    const rot = new THREE.Euler(0, 0, 0.15);
    const tn = new THREE.Vector3();

    for (let i = 0; i < vertexCount; i++) {
      const i3 = i * 3;
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      orig[i3] = x;
      orig[i3 + 1] = y;
      orig[i3 + 2] = z;

      const len = Math.hypot(x, y, z) || 1;
      const nx = x / len;
      const ny = y / len;
      const nz = z / len;
      norms[i3] = nx;
      norms[i3 + 1] = ny;
      norms[i3 + 2] = nz;

      // Multi-octave organic liquid harmonics (initial state at t = 0)
      const df =
        Math.sin(nx * 6.5 + ny * 3.5) * 0.4 +
        Math.cos(ny * 7.5 - nz * 5.0) * 0.4 +
        Math.sin(nz * 8.5 + nx * 2.5) * 0.35 +
        Math.cos(nx * 5.5 - ny * 7.0) * 0.3 +
        Math.sin(nx * 10.0 + nz * 6.0) * 0.25 +
        Math.cos(ny * 12.0 + nx * 4.5) * 0.2;

      tn.set(nx, ny, nz).applyEuler(rot);
      const wNz = tn.z;
      const fade = wNz > 0 ? Math.pow(wNz, 1.2) : 0;

      let disp = 0;
      if (df < 0) {
        disp = -Math.pow(-df, 1.05) * 0.20 * fade;
      } else {
        disp = Math.pow(df, 1.05) * 0.055;
      }

      const breath =
        Math.sin(nx * 5.0) * 0.003 +
        Math.cos(ny * 4.5) * 0.003;

      const total = disp + breath;

      posArray[i3] = x + nx * total;
      posArray[i3 + 1] = y + ny * total;
      posArray[i3 + 2] = z + nz * total;
    }

    pos.needsUpdate = true;
    geo.computeVertexNormals();

    return {
      geometry: geo,
      originalPositions: orig,
      baseNormals: norms,
      count: vertexCount,
    };
  }, []);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((state, delta) => {
    // Zero computation when hero is scrolled out of view
    if (!isVisible) return;

    const time = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);

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

      const vh = state.size.height;
      const hoverR = vh * 0.15;
      const magnetR = vh * 0.45;

      if (!scrollRootRef.current && typeof document !== "undefined") {
        scrollRootRef.current = document.querySelector(".scroll-root");
      }
      const scrollTop = scrollRootRef.current ? scrollRootRef.current.scrollTop : 0;
      const isHero = scrollTop < 100;

      const near = isHero && dist < magnetR && interactionRef.current.hasMoved;
      const hovered = isHero && dist < hoverR && interactionRef.current.hasMoved;

      interactionRef.current.isNear = near;
      interactionRef.current.isHovered = hovered;

      if (near) {
        const raw = 1 - Math.max(0, Math.min(1, (dist - hoverR) / (magnetR - hoverR)));
        interactionRef.current.hoverProgress = raw * raw * (3 - 2 * raw);
      } else {
        interactionRef.current.hoverProgress = 0;
      }
    }

    const targetHover = interactionRef.current.hoverProgress;

    /* ── 2. Exponential smoothing ── */
    const smoothingSpeed = 6.0;
    const alpha = 1 - Math.exp(-smoothingSpeed * dt);
    smoothHover.current += (targetHover - smoothHover.current) * alpha;
    interactionRef.current.smoothHoverProgress = smoothHover.current;

    // Write state for CustomCursor synchronization
    if (typeof window !== "undefined") {
      const customWin = window as CustomWindow;
      customWin.bubbleHoverProgress = smoothHover.current;
      customWin.bubbleHoldProgress = interactionRef.current.holdProgress;
      customWin.isBubbleHovered = interactionRef.current.isHovered;
      customWin.bubbleX = interactionRef.current.bubbleX;
      customWin.bubbleY = interactionRef.current.bubbleY;
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
        interactionRef.current.holdProgress + dt / 0.8
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
        interactionRef.current.holdProgress - dt * 3
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

    /* ── 6. Mouse direction in world space (smoothed) ── */
    if (groupRef.current) {
      const bpos = _vecBpos.current.set(0, 0, 0);
      groupRef.current.getWorldPosition(bpos);
      const vp = state.viewport.getCurrentViewport(state.camera, bpos);
      const rawDir = _vecRawDir.current
        .set(
          (state.pointer.x * vp.width) / 2,
          (state.pointer.y * vp.height) / 2,
          bpos.z
        )
        .sub(bpos)
        .normalize();

      const dirAlpha = 1 - Math.exp(-4.0 * dt);
      smoothMouseDir.current.lerp(rawDir, dirAlpha).normalize();
    }
    const toMouseDir = smoothMouseDir.current;
    const rot = groupRef.current ? groupRef.current.rotation : new THREE.Euler();
    const tn = _vecTn.current;

    /* ── 7. High-Performance Fluid Vertex Deformation ── */
    if (!meshRef.current) return;
    const posAttr = meshRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;

    const dimpleDampen = 1 - smoothHover.current * 0.45;
    const hCurrent = smoothHover.current;
    const popVal = smoothPop.current;
    const popD = Math.pow(popVal, 2.0) * 3.0;
    const oneMinusPop = 1 - popVal;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const ox = originalPositions[i3];
      const oy = originalPositions[i3 + 1];
      const oz = originalPositions[i3 + 2];

      const nx = baseNormals[i3];
      const ny = baseNormals[i3 + 1];
      const nz = baseNormals[i3 + 2];

      // Multi-octave organic liquid harmonics
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
      const fade = wNz > 0 ? Math.pow(wNz, 1.2) : 0;

      let disp = 0;
      if (df < 0) {
        disp = -Math.pow(-df, 1.05) * 0.20 * fade;
      } else {
        disp = Math.pow(df, 1.05) * 0.055;
      }

      const breath =
        Math.sin(nx * 5.0 + time * 0.8) * 0.003 +
        Math.cos(ny * 4.5 - time * 0.7) * 0.003;

      const dotM = tn.dot(toMouseDir);
      const ripple = dotM > 0 ? Math.pow(dotM, 1.8) * 0.055 * hCurrent : 0;

      const total = (disp + breath + ripple) * oneMinusPop + popD;

      posArray[i3] = ox + nx * total;
      posArray[i3 + 1] = oy + ny * total;
      posArray[i3 + 2] = oz + nz * total;
    }

    posAttr.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();

    /* ── 8. Material refraction & glass morphing ── */
    const mat = meshRef.current.material as unknown as Record<string, unknown>;
    if (mat) {
      const h = smoothHover.current;
      if (typeof mat.ior === "number") mat.ior = THREE.MathUtils.lerp(1.05, 1.10, h);
      if (typeof mat.thickness === "number") mat.thickness = THREE.MathUtils.lerp(0.02, 0.05, h);
      if (typeof mat.chromaticAberration === "number")
        mat.chromaticAberration = THREE.MathUtils.lerp(0.02, 0.04, h);
      if (typeof mat.distortion === "number") mat.distortion = THREE.MathUtils.lerp(0.08, 0.18, h);
      if (typeof mat.distortionScale === "number")
        mat.distortionScale = THREE.MathUtils.lerp(0.15, 0.35, h);
      if (typeof mat.iridescence === "number")
        mat.iridescence = THREE.MathUtils.lerp(0.35, 0.75, h);

      const r = THREE.MathUtils.lerp(0.98, 0.88, h);
      const g = THREE.MathUtils.lerp(0.969, 0.82, h);
      const b = THREE.MathUtils.lerp(1.0, 0.98, h);
      const matColor = mat.color as THREE.Color | undefined;
      if (matColor?.setRGB) matColor.setRGB(r, g, b);

      if (typeof mat._transmission === "number")
        mat._transmission = THREE.MathUtils.lerp(1, 0, smoothPop.current);
      if (typeof mat.opacity === "number")
        mat.opacity = THREE.MathUtils.lerp(1, 0, smoothPop.current);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.1, 0.5]}>
      <Float speed={0.8} rotationIntensity={0.02} floatIntensity={0.03}>
        <mesh ref={meshRef} geometry={geometry}>
          {/* Pure Optical Glass Refraction — Crystal-clear transparency revealing the bold text behind */}
          <MeshTransmissionMaterial
            backside={false}
            samples={tier === "high" ? 4 : 2}
            resolution={tier === "high" ? 1024 : 512}
            transmission={1.0}
            roughness={0.0}
            clearcoat={1.0}
            clearcoatRoughness={0.0}
            thickness={0.03}
            ior={1.06}
            chromaticAberration={0.025}
            anisotropy={0.1}
            anisotropicBlur={0}
            distortion={0.1}
            distortionScale={0.2}
            temporalDistortion={0.0}
            color="#faf7ff"
            attenuationColor="#f3e8ff"
            attenuationDistance={100}
            iridescence={0.4}
            iridescenceIOR={1.4}
            iridescenceThicknessRange={[100, 400]}
            toneMapped={false}
            transparent={true}
          />
        </mesh>
      </Float>
    </group>
  );
}

/* ─── 3D Text (responsive, rendered directly behind the glass lens) ─── */
function SceneText() {
  const { viewport } = useThree();
  const scale = Math.min(1, viewport.width / 5.5);

  return (
    <group scale={[scale, scale, 1]}>
      <Text
        position={[0, 0.42, -0.5]}
        fontSize={0.14}
        color="#71717a"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.13}
        font="/fonts/Inter-Regular.woff"
        sdfGlyphSize={128}
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
        sdfGlyphSize={128}
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
  isVisible,
}: {
  interactionRef: React.MutableRefObject<InteractionData>;
  isVisible: boolean;
}) {
  const arcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    let currentOpacity = 0;
    let currentScale = 0.85;

    const tick = () => {
      if (!isVisible) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const d = interactionRef.current;
      if (!d || !arcRef.current) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const targetOpacity = d.hasMoved ? d.smoothHoverProgress * 0.7 : 0;
      const targetScale = 0.85 + d.smoothHoverProgress * 0.15;

      currentOpacity += (targetOpacity - currentOpacity) * 0.08;
      currentScale += (targetScale - currentScale) * 0.08;

      arcRef.current.style.opacity = `${currentOpacity}`;
      arcRef.current.style.transform = `translate3d(${d.bubbleX}px, ${d.bubbleY}px, 0) translate(-50%, -50%) scale(${currentScale})`;

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [interactionRef, isVisible]);

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
interface FluidBubbleProps {
  isVisible?: boolean;
  tier?: DeviceTier;
}

export default function FluidBubble({ isVisible = true, tier: tierProp }: FluidBubbleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [tierState, setTierState] = useState<DeviceTier>("high");

  useEffect(() => {
    if (tierProp) return;
    import("@/lib/deviceTier").then(({ getDeviceTier }) => {
      setTierState(getDeviceTier());
    });
  }, [tierProp]);

  const activeTier = tierProp || tierState;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const interactionRef = useRef<InteractionData>({
    mouseX: -9999,
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

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const isClickable =
        target.closest("a, button, [role='button']") !== null ||
        window.getComputedStyle(target).cursor === "pointer";
      interactionRef.current.isInteractive = isClickable;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
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
        const customWin = window as CustomWindow;
        customWin.bubbleHoverProgress = 0;
        customWin.bubbleHoldProgress = 0;
      }
    };
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
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        style={{ position: "absolute", inset: 0 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
      >
        <BackgroundGradient />
        <BackgroundLines />

        <Environment preset="studio" environmentIntensity={1.8} />
        <ambientLight intensity={0.6} color="#faf5ff" />
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

        <SceneText />
        <Suspense fallback={null}>
          <BubbleMesh
            interactionRef={interactionRef}
            isVisible={isVisible}
            tier={activeTier}
          />
        </Suspense>
      </Canvas>

      {/* HTML Overlays — outside canvas */}
      <HoverArc interactionRef={interactionRef} isVisible={isVisible} />
    </div>
  );
}
