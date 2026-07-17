import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-xl border border-input bg-panel px-3.5 py-2 text-sm text-ink shadow-quiet transition-colors",
        "placeholder:text-ink-faint",
        "focus-visible:border-blue focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--blue)_30%,transparent)] outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-xl border border-input bg-panel px-3.5 py-2.5 text-sm text-ink shadow-quiet transition-colors resize-y",
        "placeholder:text-ink-faint",
        "focus-visible:border-blue focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--blue)_30%,transparent)] outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-ink select-none",
        className
      )}
      {...props}
    />
  );
}

export { Input, Textarea, Label };
