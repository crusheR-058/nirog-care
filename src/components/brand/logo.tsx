import { cn } from "@/lib/utils";

/**
 * Nirog brand mark — the heart logo (green leaves + blue figure + pulse line).
 * Rendered from /logo.svg so the same asset can be swapped for the exact raster.
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
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
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
