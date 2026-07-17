import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        neutral: "border-hairline bg-secondary text-ink-soft",
        blue: "border-transparent bg-soft-blue text-blue",
        aria: "border-transparent bg-soft-purple text-aria",
        green: "border-transparent bg-soft-green text-green",
        amber: "border-transparent bg-soft-amber text-amber",
        red: "border-transparent bg-soft-red text-red",
        indigo: "border-transparent bg-soft-indigo text-indigo",
        outline: "border-hairline-strong bg-transparent text-ink-soft",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-[13px]",
      },
    },
    defaultVariants: { tone: "neutral", size: "default" },
  }
);

function Badge({
  className,
  tone,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={cn(badgeVariants({ tone, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
