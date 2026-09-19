interface FerrofluidProps {
  active?: boolean;
  className?: string;
}

export function Ferrofluid({ active = false, className = "" }: FerrofluidProps) {
  return (
    <div aria-hidden="true" className={`ferrofluid ${active ? "ferrofluid--active" : ""} ${className}`}>
      <span />
      <span />
      <span />
    </div>
  );
}
