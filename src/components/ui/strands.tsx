import { useId } from "react";

interface StrandsProps {
  active?: boolean;
  className?: string;
}

export function Strands({ active = true, className = "" }: StrandsProps) {
  const id = useId().replaceAll(":", "");
  const gradient = `strand-gradient-${id}`;
  const blur = `strand-blur-${id}`;
  return (
    <svg aria-hidden="true" className={`strands ${active ? "strands--active" : ""} ${className}`} viewBox="0 0 600 160" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradient} x1="0" x2="1">
          <stop stopColor="#60A5FA" stopOpacity="0" />
          <stop offset="0.42" stopColor="#60A5FA" />
          <stop offset="0.7" stopColor="#38BDF8" />
          <stop offset="1" stopColor="#60A5FA" stopOpacity="0" />
        </linearGradient>
        <filter id={blur}><feGaussianBlur stdDeviation="2" /></filter>
      </defs>
      <g fill="none" stroke={`url(#${gradient})`} strokeLinecap="round">
        <path className="strands__glow" d="M-20 112 C120 20 210 176 350 69 S540 66 620 34" filter={`url(#${blur})`} />
        <path className="strands__line strands__line--one" d="M-20 112 C120 20 210 176 350 69 S540 66 620 34" />
        <path className="strands__line strands__line--two" d="M-20 83 C120 156 238 3 364 97 S510 128 620 82" />
        <path className="strands__line strands__line--three" d="M-20 42 C90 110 220 25 348 116 S500 17 620 123" />
      </g>
    </svg>
  );
}
