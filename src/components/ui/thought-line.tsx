import { Check, ChevronDown, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface ThoughtLineProps {
  working: boolean;
  label: string;
  doneLabel: string;
  steps: string[];
  className?: string;
}

export function ThoughtLine({ working, label, doneLabel, steps, className = "" }: ThoughtLineProps) {
  const [open, setOpen] = useState(true);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!working) return;
    const nextStart = performance.now();
    setStartedAt(nextStart);
    setElapsed(0);
    setOpen(true);
    const timer = window.setInterval(() => setElapsed((performance.now() - nextStart) / 1000), 100);
    return () => window.clearInterval(timer);
  }, [working]);

  useEffect(() => {
    if (!working && startedAt !== null) setOpen(false);
  }, [startedAt, working]);

  const seconds = elapsed.toFixed(1);
  const text = working ? label : `${doneLabel} ${seconds}s`;

  return (
    <div className={`thought-line ${working ? "is-working" : ""} ${className}`}>
      <button type="button" className="thought-line__head" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <Sparkles size={13} aria-hidden="true" />
        <span>{text}</span>
        <ChevronDown size={13} className={open ? "rotate-180" : ""} aria-hidden="true" />
      </button>
      {open && steps.length > 0 && (
        <div className="thought-line__steps">
          {steps.map((step, index) => {
            const done = !working || index < steps.length - 1;
            return (
              <div key={`${index}-${step}`} className="thought-line__step">
                {done ? <Check size={11} aria-hidden="true" /> : <span className="thought-line__pulse" aria-hidden="true" />}
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
