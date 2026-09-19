import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import "./magic-bento.css";

interface MagicBentoProps {
  children: React.ReactNode;
  className?: string;
  textAutoHide?: boolean;
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  disableAnimations?: boolean;
  spotlightRadius?: number;
  particleCount?: number;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  delay: number;
}

interface Ripple {
  id: string;
  x: number;
  y: number;
}

/**
 * A constrained, children-first adaptation of React Bits' Magic Bento. It
 * decorates an existing surface without changing its content or interaction
 * semantics, so the verification fixture stays outside the effect boundary.
 */
export function MagicBento({
  children,
  className,
  textAutoHide = false,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = 260,
  particleCount = 8,
  enableTilt = true,
  glowColor = "96, 165, 250",
  clickEffect = false,
  enableMagnetism = true,
}: MagicBentoProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const clearParticlesRef = useRef<number | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const animationsDisabled = disableAnimations || reduceMotion;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReduceMotion(media.matches || window.innerWidth < 768);
    updatePreference();
    media.addEventListener("change", updatePreference);
    window.addEventListener("resize", updatePreference);
    return () => {
      media.removeEventListener("change", updatePreference);
      window.removeEventListener("resize", updatePreference);
      if (clearParticlesRef.current) window.clearTimeout(clearParticlesRef.current);
      if (surfaceRef.current) gsap.killTweensOf(surfaceRef.current);
    };
  }, []);

  const clearParticles = () => {
    if (clearParticlesRef.current) window.clearTimeout(clearParticlesRef.current);
    clearParticlesRef.current = null;
    setParticles([]);
  };

  const onPointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (animationsDisabled) return;
    const surface = event.currentTarget;
    gsap.to(surface, {
      y: enableTilt || enableMagnetism ? -2 : 0,
      duration: 0.28,
      ease: "power2.out",
      overwrite: true,
    });

    if (enableStars) {
      const nextParticles = Array.from({ length: particleCount }, (_, index) => ({
        id: `${Date.now()}-${index}`,
        x: 8 + Math.random() * 84,
        y: 12 + Math.random() * 76,
        delay: index * 0.045,
      }));
      setParticles(nextParticles);
      if (clearParticlesRef.current) window.clearTimeout(clearParticlesRef.current);
      clearParticlesRef.current = window.setTimeout(clearParticles, 1_500);
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (animationsDisabled) return;
    const surface = event.currentTarget;
    const rect = surface.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    surface.style.setProperty("--magic-x", `${x}%`);
    surface.style.setProperty("--magic-y", `${y}%`);
    surface.style.setProperty("--magic-intensity", "1");

    const horizontal = ((event.clientX - rect.left) / rect.width - 0.5);
    const vertical = ((event.clientY - rect.top) / rect.height - 0.5);
    gsap.to(surface, {
      x: enableMagnetism ? horizontal * 3 : 0,
      y: enableMagnetism ? vertical * 2 - 2 : 0,
      rotationX: enableTilt ? vertical * -1.4 : 0,
      rotationY: enableTilt ? horizontal * 1.8 : 0,
      transformPerspective: 900,
      duration: 0.26,
      ease: "power2.out",
      overwrite: true,
    });
  };

  const onPointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    const surface = event.currentTarget;
    surface.style.setProperty("--magic-intensity", "0");
    clearParticles();
    if (!animationsDisabled) {
      gsap.to(surface, {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        duration: 0.36,
        ease: "power2.out",
        overwrite: true,
      });
    }
  };

  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (animationsDisabled || !clickEffect) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ripple = { id: crypto.randomUUID(), x: event.clientX - rect.left, y: event.clientY - rect.top };
    setRipples((current) => [...current, ripple]);
    window.setTimeout(() => setRipples((current) => current.filter((item) => item.id !== ripple.id)), 760);
  };

  return (
    <div
      ref={surfaceRef}
      className={cn(
        "magic-bento",
        textAutoHide && "magic-bento--text-autohide",
        enableSpotlight && "magic-bento--spotlight",
        enableBorderGlow && "magic-bento--border-glow",
        animationsDisabled && "magic-bento--static",
        className,
      )}
      style={{
        "--magic-glow-color": glowColor,
        "--magic-radius": `${spotlightRadius}px`,
      } as React.CSSProperties}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onClick={onClick}
    >
      <span className="magic-bento__spotlight" aria-hidden="true" />
      <span className="magic-bento__border" aria-hidden="true" />
      <span className="magic-bento__particles" aria-hidden="true">
        {particles.map((particle) => (
          <i
            key={particle.id}
            className="magic-bento__particle"
            style={{ "--particle-x": `${particle.x}%`, "--particle-y": `${particle.y}%`, animationDelay: `${particle.delay}s` } as React.CSSProperties}
          />
        ))}
      </span>
      {ripples.map((ripple) => (
        <span key={ripple.id} className="magic-bento__ripple" style={{ left: ripple.x, top: ripple.y }} aria-hidden="true" />
      ))}
      <div className="magic-bento__content">{children}</div>
    </div>
  );
}
