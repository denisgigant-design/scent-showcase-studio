import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FRAGRANCES, PHONE_QUERY, type FragranceKey } from "@/data/fragrances";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Segmented } from "@/components/lux/Segmented";
import { DayNightSwitch } from "@/components/lux/DayNightSwitch";
import { useSite } from "./store";

type Tab = "pyramid" | "character" | "mood";

export function NotesSheet() {
  const { notesOpen, setNotesOpen, state } = useSite();
  const phone = useMediaQuery(PHONE_QUERY);
  const key: FragranceKey = state === "gallery" ? "galet" : state;
  return (
    <Sheet open={notesOpen} onOpenChange={setNotesOpen}>
      <SheetContent
        side={phone ? "bottom" : "right"}
        className="glass-card max-h-[88svh] overflow-y-auto border-border p-0 sm:max-w-md"
      >
        <NotesBody key={key} fkey={key} />
      </SheetContent>
    </Sheet>
  );
}

function NotesBody({ fkey }: { fkey: FragranceKey }) {
  const f = FRAGRANCES[fkey];
  const [tab, setTab] = useState<Tab>("pyramid");
  const [night, setNight] = useState(false);
  return (
    <div className="relative overflow-hidden p-6 pb-10 sm:p-8">
      <div
        aria-hidden
        className="blob pointer-events-none absolute -right-24 -top-24 size-72 opacity-40 blur-3xl"
        style={{ background: f.tone }}
      />
      <SheetHeader className="relative text-left">
        <p className="eyebrow-text">{f.num} · {f.family}</p>
        <SheetTitle className="font-display text-5xl leading-none text-foreground">{f.name}</SheetTitle>
        <SheetDescription className="text-sm text-muted-foreground">{f.desc}</SheetDescription>
      </SheetHeader>

      <div className="relative mt-6 flex justify-center">
        <img src={f.img} alt="" className="h-44 animate-float-slow object-contain drop-shadow-2xl" />
      </div>

      <Segmented
        className="relative mt-6"
        label="Detail view"
        size="sm"
        value={tab}
        onChange={setTab}
        options={[
          { value: "pyramid", label: "Pyramid" },
          { value: "character", label: "Character" },
          { value: "mood", label: "Mood" },
        ]}
      />

      <div className="relative mt-6 min-h-64">
        {tab === "pyramid" && (
          <div className="space-y-3">
            {(
              [
                ["Top", "First 15 minutes", f.notes.top, "w-[64%]"],
                ["Heart", "Hours 1–4", f.notes.heart, "w-[82%]"],
                ["Base", "Lingers 8h+", f.notes.base, "w-full"],
              ] as const
            ).map(([tier, when, notes, width], i) => (
              <div
                key={tier}
                className={`${width} mx-auto rounded-2xl border border-border bg-foreground/5 p-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700`}
                style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}
              >
                <p className="eyebrow-text">
                  {tier} · <span className="normal-case tracking-normal">{when}</span>
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                  {notes.map((n) => (
                    <span key={n} className="rounded-full border border-border px-2.5 py-1 text-xs">
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "character" && (
          <div className="space-y-4">
            {(Object.entries(f.metrics) as [string, number][]).map(([label, v], i) => (
              <div key={label}>
                <div className="mb-1.5 flex justify-between text-xs capitalize">
                  <span>{label}</span>
                  <span className="text-muted-foreground">{v}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full origin-left rounded-full animate-in slide-in-from-left-full duration-1000 ease-luxe"
                    style={{ width: `${v}%`, background: f.tone, boxShadow: `0 0 12px ${f.tone}`, animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "mood" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-3 eyebrow-text">
              Day <DayNightSwitch night={night} onChange={setNight} /> Night
            </div>
            <p key={String(night)} className="font-display max-w-xs text-3xl leading-tight animate-in fade-in zoom-in-95 duration-700">
              “{night ? f.night : f.day}”
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
