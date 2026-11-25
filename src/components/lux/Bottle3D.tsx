import { useEffect, useRef, useState } from "react";
import { FRAGRANCES, type FragranceKey } from "@/data/fragrances";

type Viewer = {
  mountBottle: (
    canvas: HTMLCanvasElement,
    key: string,
    options: { spin?: boolean; drag?: boolean; onReady?: () => void; onFail?: () => void },
  ) => () => void;
};
let viewer: Promise<Viewer> | undefined;
const loadViewer = () =>
  (viewer ??= import(
    /* @vite-ignore */ new URL(`${import.meta.env.BASE_URL}showroom/bottle-viewer.js?v=2`, document.baseURI).href
  ) as Promise<Viewer>);

/**
 * A live, turning 3D bottle (the same glass models as the showroom).
 * `spin` keeps it rotating; `drag` lets people turn it by hand. Size it with className.
 * The flat image only shows while the model loads or if 3D is unavailable.
 */
export function Bottle3D({
  k,
  className = "",
  spin = true,
  drag = false,
  label,
  style,
}: {
  k: FragranceKey;
  className?: string;
  spin?: boolean;
  drag?: boolean;
  label?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const f = FRAGRANCES[k];

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    setReady(false);
    let off: (() => void) | undefined;
    let cancelled = false;
    loadViewer()
      .then((v) => {
        if (cancelled) return;
        off = v.mountBottle(canvas, k, {
          spin,
          drag,
          onReady: () => setReady(true),
          onFail: () => setFailed(true),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      off?.();
    };
  }, [k, spin, drag]);

  return (
    <span
      className={`relative inline-block ${className}`}
      style={style}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {(!ready || failed) && (
        <img src={f.img} alt="" className="absolute inset-0 size-full object-contain opacity-60" />
      )}
      {!failed && (
        <canvas
          ref={ref}
          className={`absolute inset-0 size-full transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"} ${drag ? "cursor-grab touch-pan-y active:cursor-grabbing" : ""}`}
        />
      )}
    </span>
  );
}
