import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4",
  {
    variants: {
      variant: {
        // App language: primary is a black pill (light) / brand-blue (dark).
        primary:
          "bg-primary text-primary-foreground shadow-quiet hover:brightness-[1.08] active:brightness-95",
        blue: "bg-blue text-white shadow-quiet hover:brightness-[1.06] active:brightness-95",
        aria: "bg-aria text-white shadow-quiet hover:brightness-[1.06]",
        ink: "bg-ink text-white hover:brightness-110",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary)_88%,var(--ink))]",
        outline:
          "border border-hairline-strong bg-panel text-ink hover:bg-secondary",
        ghost: "text-ink-soft hover:bg-secondary hover:text-ink",
        danger:
          "bg-red text-white shadow-quiet hover:brightness-[1.06]",
        link: "text-blue underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3.5 text-[13px]",
        default: "h-10 px-5",
        lg: "h-12 px-7 text-[15px]",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
