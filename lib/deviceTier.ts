"use client";

import { useSyncExternalStore, useCallback } from "react";

export type DeviceTier = "high" | "mid" | "low";

export interface DeviceCapabilities {
  tier: DeviceTier;
  hardwareConcurrency: number;
  deviceMemory: number;
  gpuRenderer: string;
  isLowPowerGPU: boolean;
  saveData: boolean;
  effectiveType: string;
  prefersReducedMotion: boolean;
  maxTextureSize: number;
  canUseWebGL: boolean;
}

const DEFAULT_CAPABILITIES: DeviceCapabilities = {
  tier: "mid",
  hardwareConcurrency: 4,
  deviceMemory: 4,
  gpuRenderer: "unknown",
  isLowPowerGPU: false,
  saveData: false,
  effectiveType: "4g",
  prefersReducedMotion: false,
  maxTextureSize: 4096,
  canUseWebGL: true,
};

const LOW_POWER_GPU_REGEX =
  /mali-(?:400|450|t\d+|g3\d|g5\d)|adreno\s*(?:2\d\d|3\d\d|4\d\d|50\d|51\d|61\d|62\d)|powervr|intel\s*(?:hd|uhd)\s*graphics|intel\s*iris\s*(?:5\d\d|6\d\d)|apple\s*a(?:8|9|10|11|12)\b|swiftshader|llvmpipe|software\s*rasterizer/i;

let cachedCapabilities: DeviceCapabilities | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function getDeviceTier(): DeviceTier {
  return detectDeviceCapabilities().tier;
}

/**
 * Performs a lightweight client hardware benchmark.
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return DEFAULT_CAPABILITIES;
  }

  let forcedTier: DeviceTier | null = null;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const paramTier = urlParams.get("tier");
    if (paramTier === "low" || paramTier === "mid" || paramTier === "high") {
      forcedTier = paramTier as DeviceTier;
    }
  } catch {}

  if (cachedCapabilities && !forcedTier) {
    return cachedCapabilities;
  }

  try {
    const stored = sessionStorage.getItem("portfolio_device_capabilities");
    if (stored && !forcedTier) {
      cachedCapabilities = JSON.parse(stored) as DeviceCapabilities;
      return cachedCapabilities;
    }
  } catch {
    // Ignore
  }

  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const saveData = Boolean(conn?.saveData);
  const effectiveType = conn?.effectiveType || "4g";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let gpuRenderer = "unknown";
  let isLowPowerGPU = false;
  let maxTextureSize = 4096;
  let canUseWebGL = false;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const gl =
      (canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")) as WebGLRenderingContext | WebGL2RenderingContext | null;

    if (gl) {
      canUseWebGL = true;
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        gpuRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
      }

      if (LOW_POWER_GPU_REGEX.test(gpuRenderer)) {
        isLowPowerGPU = true;
      }
    }
  } catch {
    canUseWebGL = false;
  }

  let tier: DeviceTier = "mid";

  if (!canUseWebGL || saveData || effectiveType === "2g" || effectiveType === "3g" || prefersReducedMotion) {
    tier = "low";
  } else if (
    deviceMemory < 4 ||
    hardwareConcurrency <= 4 ||
    isLowPowerGPU ||
    maxTextureSize < 4096
  ) {
    tier = "low";
  } else if (deviceMemory >= 8 && hardwareConcurrency >= 8 && !isLowPowerGPU && maxTextureSize >= 8192) {
    tier = "high";
  } else {
    tier = "mid";
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const forcedTier = urlParams.get("tier");
    if (forcedTier === "low" || forcedTier === "mid" || forcedTier === "high") {
      tier = canUseWebGL ? (forcedTier as DeviceTier) : "low";
    }
  } catch {
    // Ignore
  }

  cachedCapabilities = {
    tier,
    hardwareConcurrency,
    deviceMemory,
    gpuRenderer,
    isLowPowerGPU,
    saveData,
    effectiveType,
    prefersReducedMotion,
    maxTextureSize,
    canUseWebGL,
  };

  try {
    sessionStorage.setItem("portfolio_device_capabilities", JSON.stringify(cachedCapabilities));
  } catch {
    // Ignore
  }

  return cachedCapabilities;
}

function subscribe(callback: () => void) {
  listeners.add(callback);

  const handleDowngrade = (e: Event) => {
    const customEvent = e as CustomEvent<{ targetTier: DeviceTier }>;
    if (customEvent.detail?.targetTier && cachedCapabilities) {
      cachedCapabilities = {
        ...cachedCapabilities,
        tier: customEvent.detail.targetTier,
      };
      notifyListeners();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("portfolio:tier-downgrade", handleDowngrade);
  }

  return () => {
    listeners.delete(callback);
    if (typeof window !== "undefined") {
      window.removeEventListener("portfolio:tier-downgrade", handleDowngrade);
    }
  };
}

function getSnapshot(): DeviceCapabilities {
  if (typeof window === "undefined") {
    return DEFAULT_CAPABILITIES;
  }
  return detectDeviceCapabilities();
}

function getServerSnapshot(): DeviceCapabilities {
  return DEFAULT_CAPABILITIES;
}

/**
 * Idiomatic React 19 hook using useSyncExternalStore.
 * Avoids setState-in-effect and cascading re-renders.
 */
export function useDeviceTier(): {
  tier: DeviceTier;
  isLowTier: boolean;
  isMidTier: boolean;
  isHighTier: boolean;
  capabilities: DeviceCapabilities;
  isHydrated: boolean;
  setTier: (tier: DeviceTier) => void;
} {
  const capabilities = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isHydrated = typeof window !== "undefined";

  const setTier = useCallback((newTier: DeviceTier) => {
    if (cachedCapabilities) {
      cachedCapabilities = { ...cachedCapabilities, tier: newTier };
      try {
        sessionStorage.setItem("portfolio_device_capabilities", JSON.stringify(cachedCapabilities));
      } catch {}
      notifyListeners();
    }
  }, []);

  return {
    tier: capabilities.tier,
    isLowTier: capabilities.tier === "low" || !capabilities.canUseWebGL,
    isMidTier: capabilities.tier === "mid" && capabilities.canUseWebGL,
    isHighTier: capabilities.tier === "high" && capabilities.canUseWebGL,
    capabilities,
    isHydrated,
    setTier,
  };
}

/**
 * Dynamic frame watchdog.
 */
export class RuntimeFPSWatchdog {
  private frameCount = 0;
  private lastTime = performance.now();
  private dropIntervals = 0;
  private active = true;

  public start() {
    if (typeof window === "undefined") return;

    const tick = (now: number) => {
      if (!this.active) return;
      this.frameCount++;

      const elapsed = now - this.lastTime;
      if (elapsed >= 1000) {
        const fps = (this.frameCount * 1000) / elapsed;
        this.frameCount = 0;
        this.lastTime = now;

        if (fps < 32) {
          this.dropIntervals++;
          if (this.dropIntervals >= 2) {
            window.dispatchEvent(
              new CustomEvent("portfolio:tier-downgrade", {
                detail: { targetTier: "low" },
              })
            );
            this.active = false;
            return;
          }
        } else {
          this.dropIntervals = 0;
        }
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  public stop() {
    this.active = false;
  }
}
