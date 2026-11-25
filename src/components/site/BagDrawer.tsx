import { Bottle3D } from "@/components/lux/Bottle3D";
import { Gift, Minus, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FRAGRANCES, priceFor } from "@/data/fragrances";
import { GIFT_THRESHOLD } from "@/lib/bag";
import { useSite } from "./store";

export function BagDrawer() {
  const { bag, bagOpen, setBagOpen, subtotal, change, count } = useSite();
  const toGift = Math.max(0, GIFT_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / GIFT_THRESHOLD) * 100);
  return (
    <Sheet open={bagOpen} onOpenChange={setBagOpen}>
      <SheetContent className="glass-card flex w-full flex-col gap-0 border-border p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-6 text-left">
          <SheetTitle className="font-display text-4xl font-normal text-foreground">Your bag</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {count ? `${count} item${count > 1 ? "s" : ""}` : "Nothing here yet"}
          </SheetDescription>
        </SheetHeader>

        <div className="border-b border-border px-6 py-4">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <Gift className="size-3.5 text-champagne" />
            {toGift > 0 ? (
              <span>
                Add <b>€{toGift}</b> for a complimentary discovery set
              </span>
            ) : (
              <span className="text-champagne">Complimentary discovery set unlocked ✦</span>
            )}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-[image:var(--gradient-ink)] transition-[width] duration-1000 ease-luxe"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-6">
          {bag.length === 0 && (
            <p className="py-16 text-center font-display text-2xl text-muted-foreground">Your bag is empty.</p>
          )}
          {bag.map((l) => {
            const f = FRAGRANCES[l.key];
            return (
              <div
                key={`${l.key}-${l.size}`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-foreground/5 p-3 animate-in fade-in slide-in-from-right-6 duration-500"
              >
                <div className="grid h-20 w-16 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${f.tone} 18%, transparent)` }}>
                  <Bottle3D k={f.key} spin={false} className="h-[4.5rem] w-14" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-xl leading-tight">{f.name}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {l.size} ml · €{priceFor(l.key, l.size)}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-border p-1">
                  <button aria-label={`Remove one ${f.name}`} onClick={() => change(l.key, l.size, -1)} className="grid size-7 place-items-center rounded-full hover:bg-foreground/10">
                    <Minus className="size-3" />
                  </button>
                  <span className="w-5 text-center text-xs tabular-nums">{l.qty}</span>
                  <button aria-label={`Add one ${f.name}`} onClick={() => change(l.key, l.size, 1)} className="grid size-7 place-items-center rounded-full hover:bg-foreground/10">
                    <Plus className="size-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="eyebrow-text">Subtotal</span>
            <span className="font-display text-3xl tabular-nums">€{subtotal}</span>
          </div>
          <button
            disabled={!count}
            className="w-full rounded-full bg-foreground py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground transition hover:shadow-glow disabled:opacity-40"
            style={{ ["--glow" as string]: "var(--champagne)" }}
          >
            Checkout — demo only
          </button>
          <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground">
            Interactive concept. Products and prices are illustrative; checkout and payment are not connected.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
