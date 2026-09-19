import { Check, X } from "lucide-react";

interface LatticeLoaderProps {
  status: "idle" | "working" | "done" | "error";
  label: string;
  className?: string;
}

export function LatticeLoader({ status, label, className = "" }: LatticeLoaderProps) {
  return (
    <div className={`lattice-loader lattice-loader--${status} ${className}`} aria-live="polite">
      <span className="lattice-loader__grid" aria-hidden="true">
        {Array.from({ length: 9 }, (_, index) => <i key={index} style={{ animationDelay: `${index * 80}ms` }} />)}
        {status === "done" && <Check className="lattice-loader__mark" size={13} />}
        {status === "error" && <X className="lattice-loader__mark" size={13} />}
      </span>
      <span>{label}</span>
    </div>
  );
}
