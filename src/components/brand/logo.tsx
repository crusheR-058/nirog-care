import { cn } from "@/lib/utils";

/**
 * Nirog mark: a calm diagnostic "+" inside a ring — the pitch's cover motif —
 * paired with the wordmark. The glyph reads as both a medical cross and a
 * pulse origin point.
 */
export function LogoMark({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        fill="none"
        className="text-blue"
      >
        <circle
          cx="16"
          cy="16"
          r="14.5"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1.5"
        />
        <circle cx="16" cy="16" r="9.5" fill="currentColor" fillOpacity="0.1" />
        <path
          d="M16 10.5v11M10.5 16h11"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function Wordmark({
  className,
  showDot = true,
}: {
  className?: string;
  showDot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-semibold tracking-tight text-ink",
        className
      )}
    >
      Nirog
      {showDot && (
        <span className="ml-0.5 inline-block size-1.5 translate-y-[-1px] rounded-full bg-blue" />
      )}
    </span>
  );
}

export function Logo({
  className,
  size = 28,
  wordmarkClassName,
}: {
  className?: string;
  size?: number;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <Wordmark className={wordmarkClassName} />
    </span>
  );
}
