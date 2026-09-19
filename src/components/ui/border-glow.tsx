import { type CSSProperties, type ReactNode, useRef } from "react";

interface BorderGlowProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  animated?: boolean;
}

export function BorderGlow({ children, className = "", glowColor = "96, 165, 250", animated = false }: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--glow-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
    card.style.setProperty("--glow-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    card.style.setProperty("--glow-opacity", "1");
  };

  return (
    <div
      ref={cardRef}
      className={`border-glow ${animated ? "border-glow--animated" : ""} ${className}`}
      style={{ "--glow-rgb": glowColor } as CSSProperties}
      onPointerMove={onPointerMove}
      onPointerLeave={() => cardRef.current?.style.setProperty("--glow-opacity", "0")}
    >
      {children}
    </div>
  );
}
