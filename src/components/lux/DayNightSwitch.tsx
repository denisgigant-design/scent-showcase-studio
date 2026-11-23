import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/** Animated day/night toggle: the knob travels and morphs between sun and moon. */
export function DayNightSwitch({
  night,
  onChange,
  className,
}: {
  night: boolean;
  onChange: (night: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={night}
      aria-label={night ? "Night mode on" : "Day mode on"}
      onClick={() => onChange(!night)}
      className={cn(
        "group relative h-9 w-[76px] shrink-0 overflow-hidden rounded-full border border-border transition-colors duration-700",
        night ? "bg-basalt-deep" : "bg-champagne/25",
        className,
      )}
    >
      {/* stars */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 transition-opacity duration-700",
          night ? "opacity-100" : "opacity-0",
        )}
      >
        <span className="absolute left-3 top-2 size-0.5 rounded-full bg-foreground" />
        <span className="absolute left-6 top-5 size-1 rounded-full bg-foreground/70" />
        <span className="absolute left-9 top-2.5 size-0.5 rounded-full bg-foreground/80" />
      </span>
      <span
        className={cn(
          "absolute top-1 grid size-7 place-items-center rounded-full shadow-glow transition-all duration-700 ease-luxe",
          night ? "left-[42px] rotate-[360deg] bg-foreground text-primary-foreground" : "left-1 bg-champagne text-accent-foreground",
        )}
        style={{ ["--glow" as string]: night ? "var(--tone-iris)" : "var(--champagne)" }}
      >
        {night ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      </span>
    </button>
  );
}
