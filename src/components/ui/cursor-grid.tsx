import { useEffect, useRef } from "react";

interface CursorGridProps {
  color?: string;
  cellSize?: number;
  radius?: number;
  className?: string;
}

const toRgb = (hex: string) => {
  const value = hex.replace("#", "");
  const expanded = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  const parsed = Number.parseInt(expanded, 16);
  return `${(parsed >> 16) & 255}, ${(parsed >> 8) & 255}, ${parsed & 255}`;
};

export function CursorGrid({ color = "#60A5FA", cellSize = 28, radius = 128, className = "" }: CursorGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!container || !canvas || !context) return;

    const rgb = toRgb(color);
    let frame = 0;
    let size = { width: 0, height: 0, dpr: 1 };
    let pointer = { x: -9999, y: -9999, time: 0 };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = { width: rect.width, height: rect.height, dpr };
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const { width, height } = size;
      context.clearRect(0, 0, width, height);
      const elapsed = performance.now() - pointer.time;
      const fade = Math.max(0, 1 - elapsed / 950);

      for (let x = 0; x < width + cellSize; x += cellSize) {
        for (let y = 0; y < height + cellSize; y += cellSize) {
          const centerX = x + cellSize / 2;
          const centerY = y + cellSize / 2;
          const distance = Math.hypot(pointer.x - centerX, pointer.y - centerY);
          const intensity = distance < radius ? Math.pow(1 - distance / radius, 2) * fade : 0;
          context.strokeStyle = `rgba(${rgb}, ${0.045 + intensity * 0.42})`;
          context.lineWidth = intensity > 0 ? 1.15 : 0.65;
          context.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1);
          if (intensity > 0.08) {
            context.fillStyle = `rgba(${rgb}, ${intensity * 0.09})`;
            context.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          }
        }
      }

      frame = requestAnimationFrame(draw);
    };

    const onMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return;
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, time: performance.now() };
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    window.addEventListener("pointermove", onMove, { passive: true });
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [cellSize, color, radius]);

  return <div ref={containerRef} aria-hidden="true" className={`cursor-grid ${className}`}><canvas ref={canvasRef} /></div>;
}
