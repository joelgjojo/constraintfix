import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

const MAX_COLORS = 8;

export interface FerrofluidProps {
  className?: string;
  dpr?: number;
  paused?: boolean;
  colors?: string[];
  speed?: number;
  scale?: number;
  turbulence?: number;
  fluidity?: number;
  rimWidth?: number;
  sharpness?: number;
  shimmer?: number;
  glow?: number;
  flowDirection?: "up" | "down" | "left" | "right";
  opacity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
  mouseDampening?: number;
  mixBlendMode?: CSSProperties["mixBlendMode"];
}

const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "").padEnd(6, "0");
  return [
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255,
  ];
};

const prepareColors = (colors: string[]) => {
  const selected = (colors.length ? colors : ["#4F46E5", "#06B6D4", "#E0F2FE"]).slice(0, MAX_COLORS);
  const palette = Array.from({ length: MAX_COLORS }, (_, index) => hexToRgb(selected[Math.min(index, selected.length - 1)]));
  return { palette, count: selected.length };
};

const flowVector = (direction: FerrofluidProps["flowDirection"]) => {
  if (direction === "up") return [0, 1];
  if (direction === "left") return [-1, 0];
  if (direction === "right") return [1, 0];
  return [0, -1];
};

const vertex = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragment = `
precision highp float;
uniform vec3 iResolution;
uniform vec2 iMouse;
uniform float iTime;
uniform vec3 uColor0; uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3;
uniform vec3 uColor4; uniform vec3 uColor5; uniform vec3 uColor6; uniform vec3 uColor7;
uniform int uColorCount;
uniform vec2 uFlow;
uniform float uSpeed; uniform float uScale; uniform float uTurbulence; uniform float uFluidity;
uniform float uRimWidth; uniform float uSharpness; uniform float uShimmer; uniform float uGlow;
uniform float uOpacity; uniform float uMouseEnabled; uniform float uMouseStrength; uniform float uMouseRadius;
varying vec2 vUv;
#define PI 3.14159265

vec3 palette(float height) {
  int count = uColorCount;
  if (count < 1) count = 1;
  int index = int(floor(clamp(height, 0.0, 0.999999) * float(count)));
  if (index <= 0) return uColor0; if (index == 1) return uColor1; if (index == 2) return uColor2;
  if (index == 3) return uColor3; if (index == 4) return uColor4; if (index == 5) return uColor5;
  if (index == 6) return uColor6; return uColor7;
}
float hash(vec3 value) { value = fract(value * 0.1031); value += dot(value, value.zyx + 33.33); return fract((value.x + value.y) * value.z); }
float ease(float from, float to, float at) { return mix(from, to, (sin(at * PI - PI / 2.0) + 1.0) / 2.0); }
float noise(vec2 point, float cell, float seed) {
  vec2 grid = floor(point / cell); vec2 local = mod(point, cell);
  float a = hash(vec3(grid, seed)); float b = hash(vec3(grid.x + 1.0, grid.y, seed));
  float c = hash(vec3(grid.x + 1.0, grid.y + 1.0, seed)); float d = hash(vec3(grid.x, grid.y + 1.0, seed));
  return ease(ease(a, b, local.x / cell), ease(d, c, local.x / cell), local.y / cell);
}
float detailNoise(vec2 point, float cell, float seed) {
  float offset = cell / 2.0;
  return (2.0 * noise(point, cell, seed) + 1.5 * noise(point + vec2(offset), cell, seed + .1)
    + 1.25 * noise(point + vec2(-offset, offset), cell, seed + .2)
    + 1.125 * noise(point + vec2(offset, -offset), cell, seed + .3)
    + noise(point + vec2(-offset), cell, seed + .4)) / 7.0;
}
float smoothMin(float a, float b, float strength) { return -strength * log2(exp2(-a / strength) + exp2(-b / strength)); }
void main() {
  float reference = 700.0 / max(uScale, .05);
  vec2 point = vUv * iResolution.xy / iResolution.y * reference;
  float speed = 200.0 * uSpeed; vec2 direction = uFlow; vec2 perpendicular = vec2(-direction.y, direction.x);
  float firstDistort = noise(point + perpendicular * iTime * speed, 60.0, 10.0) * 50.0 * uTurbulence;
  float secondDistort = noise(point - perpendicular * iTime * speed, 120.0, 15.0) * 100.0 * uTurbulence;
  float first = detailNoise(point + firstDistort + direction * iTime * speed * .5, 40.0, 1.0);
  float second = detailNoise(point + secondDistort - direction * iTime * speed * .5, 40.0, .0);
  float surface = smoothMin(first, second, max(uFluidity, .001));
  float cursor = .0;
  if (uMouseEnabled > .5) {
    vec2 mouse = iMouse / iResolution.y * reference;
    float distance = length(point - mouse) / reference;
    cursor = exp(-distance * distance / max(uMouseRadius * uMouseRadius, .0004)) * uMouseStrength;
  }
  float band = (uRimWidth - abs((surface - .4) * 2.0)) * 5.0;
  float rim = clamp(band - noise(point + direction * iTime * speed * .5, 60.0, 12.0) * uShimmer, .0, 1.0);
  rim = pow(rim, uSharpness) * uGlow * clamp(1.0 - cursor, .0, 1.0);
  vec3 color = palette(clamp(.5 + (first - second) * .8, .0, 1.0)) * rim;
  gl_FragColor = vec4(color, clamp(max(color.r, max(color.g, color.b)), .0, 1.0) * uOpacity);
}`;

/** WebGL Ferrofluid, adapted from the supplied React Bits component. */
export default function Ferrofluid({
  className = "",
  dpr,
  paused = false,
  colors = ["#ffffff", "#ffffff", "#ffffff"],
  speed = 0.5,
  scale = 1.6,
  turbulence = 1,
  fluidity = 0.1,
  rimWidth = 0.2,
  sharpness = 2.5,
  shimmer = 1.5,
  glow = 2,
  flowDirection = "down",
  opacity = 1,
  mouseInteraction = true,
  mouseStrength = 1,
  mouseRadius = 0.35,
  mouseDampening = 0.15,
  mixBlendMode,
}: FerrofluidProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({ dpr: dpr ?? Math.min(window.devicePixelRatio || 1, 2), alpha: true, antialias: true });
    } catch {
      container.dataset.renderer = "fallback";
      return;
    }

    const canvas = renderer.gl.canvas;
    canvas.style.cssText = "display:block;width:100%;height:100%;";
    container.appendChild(canvas);

    const { palette, count } = prepareColors(colors);
    const uniforms = {
      iResolution: { value: [canvas.width, canvas.height, 1] }, iMouse: { value: [0, 0] }, iTime: { value: 0 },
      uColor0: { value: palette[0] }, uColor1: { value: palette[1] }, uColor2: { value: palette[2] }, uColor3: { value: palette[3] },
      uColor4: { value: palette[4] }, uColor5: { value: palette[5] }, uColor6: { value: palette[6] }, uColor7: { value: palette[7] },
      uColorCount: { value: count }, uFlow: { value: flowVector(flowDirection) }, uSpeed: { value: speed }, uScale: { value: scale },
      uTurbulence: { value: turbulence }, uFluidity: { value: fluidity }, uRimWidth: { value: rimWidth }, uSharpness: { value: sharpness },
      uShimmer: { value: shimmer }, uGlow: { value: glow }, uOpacity: { value: opacity }, uMouseEnabled: { value: mouseInteraction ? 1 : 0 },
      uMouseStrength: { value: mouseStrength }, uMouseRadius: { value: mouseRadius },
    };
    const program = new Program(renderer.gl, { vertex, fragment, uniforms });
    const mesh = new Mesh(renderer.gl, { geometry: new Triangle(renderer.gl), program });
    let animationFrame = 0;
    let lastTime = 0;
    let mouseTarget = [0, 0];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(Math.max(rect.width, 1), Math.max(rect.height, 1));
      uniforms.iResolution.value = [renderer.gl.drawingBufferWidth, renderer.gl.drawingBufferHeight, 1];
    };
    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      const scaleFactor = renderer.dpr || 1;
      mouseTarget = [(event.clientX - rect.left) * scaleFactor, (rect.height - (event.clientY - rect.top)) * scaleFactor];
      if (mouseDampening <= 0) uniforms.iMouse.value = mouseTarget;
    };
    const render = (time: number) => {
      animationFrame = requestAnimationFrame(render);
      uniforms.iTime.value = time * .001;
      if (mouseDampening > 0) {
        const delta = Math.min((time - lastTime) / 1000 || 0, .05);
        lastTime = time;
        const factor = 1 - Math.exp(-delta / Math.max(mouseDampening, .0001));
        uniforms.iMouse.value[0] += (mouseTarget[0] - uniforms.iMouse.value[0]) * factor;
        uniforms.iMouse.value[1] += (mouseTarget[1] - uniforms.iMouse.value[1]) * factor;
      }
      if (!paused) renderer.render({ scene: mesh });
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    if (mouseInteraction) window.addEventListener("pointermove", onPointerMove, { passive: true });
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      canvas.remove();
      renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [colors, dpr, flowDirection, fluidity, glow, mouseDampening, mouseInteraction, mouseRadius, mouseStrength, opacity, paused, rimWidth, scale, sharpness, shimmer, speed, turbulence]);

  return <div ref={containerRef} aria-hidden="true" className={`ferrofluid-container ${className}`} style={{ mixBlendMode }} />;
}
