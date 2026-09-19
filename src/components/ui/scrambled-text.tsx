import { useEffect, useRef, useState } from "react";

interface ScrambledTextProps {
  children: string;
  className?: string;
  scrambleChars?: string;
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ScrambledText({ children, className = "", scrambleChars = ".:/" }: ScrambledTextProps) {
  const [displayed, setDisplayed] = useState(children);
  const frameRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  const scramble = () => {
    if (prefersReducedMotion() || frameRef.current !== null) return;

    let frame = 0;
    const animate = () => {
      frame += 1;
      const revealAt = Math.max(0, children.length - frame * 5);
      setDisplayed(
        Array.from(children, (character, index) => {
          if (character === " " || index >= revealAt) return character;
          return scrambleChars[Math.floor(Math.random() * scrambleChars.length)] ?? character;
        }).join(""),
      );

      if (frame < 8) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayed(children);
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  };

  return (
    <span className={`scrambled-text ${className}`} onPointerEnter={scramble} onFocus={scramble} tabIndex={0}>
      <span aria-hidden="true">{displayed}</span>
      <span className="sr-only">{children}</span>
    </span>
  );
}
