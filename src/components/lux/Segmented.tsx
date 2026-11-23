import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Option<T extends string | number> = { value: T; label: string };

/** Pill toggle with a glowing indicator that slides between options. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
  size = "md",
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const el = wrap.current?.querySelector<HTMLElement>(`[data-active="true"]`);
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    return () => ro.disconnect();
  }, [value, options.length]);
  return (
    <div
      ref={wrap}
      role="radiogroup"
      aria-label={label}
      className={cn(
        "relative inline-flex items-center rounded-full border border-border bg-basalt-deep/60 p-1 backdrop-blur-xl",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-full bg-foreground shadow-glow transition-all duration-500 ease-luxe"
        style={{ left: pill.left, width: pill.width, ["--glow" as string]: "var(--champagne)" }}
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            data-active={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative z-10 rounded-full font-medium uppercase tracking-[0.16em] transition-colors duration-300",
              size === "sm" ? "px-3 py-1.5 text-[9px]" : "px-4 py-2 text-[10px]",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
