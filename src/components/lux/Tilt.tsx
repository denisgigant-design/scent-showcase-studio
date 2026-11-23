import { useRef, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

/** Card that tilts in 3D toward the pointer, with a glare highlight. */
export function Tilt({ children, className, max = 12 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(x - 0.5) * max * 2}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * max * 2}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };
  const leave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={cn("tilt relative", className)}>
      {children}
      <div aria-hidden className="tilt-glare pointer-events-none absolute inset-0 rounded-[inherit]" />
    </div>
  );
}
