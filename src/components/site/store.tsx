import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { FRAGRANCES, priceFor, type FragranceKey, type Size } from "@/data/fragrances";
import { addToBag, bagCount, bagSubtotal, changeQty, parseBag, type Bag } from "@/lib/bag";
import type { ShowroomApi, ShowroomState } from "@/showroom/controller";

type Store = {
  bag: Bag;
  count: number;
  subtotal: number;
  add: (key: FragranceKey, size: Size) => void;
  change: (key: FragranceKey, size: Size, delta: number) => void;
  bagOpen: boolean;
  setBagOpen: (v: boolean) => void;
  notesOpen: boolean;
  setNotesOpen: (v: boolean) => void;
  state: ShowroomState;
  setState: (s: ShowroomState) => void;
  apiRef: React.MutableRefObject<ShowroomApi | null>;
  /** Scroll up to the showroom and open a bottle. */
  showInShowroom: (key: FragranceKey) => void;
};

const Ctx = createContext<Store | null>(null);
const BAG_KEY = "unveiled-bag-v2";

export function SiteProvider({ children }: { children: ReactNode }) {
  const [bag, setBag] = useState<Bag>([]);
  const [bagOpen, setBagOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [state, setState] = useState<ShowroomState>("gallery");
  const apiRef = useRef<ShowroomApi | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      setBag(parseBag(JSON.parse(localStorage.getItem(BAG_KEY) || "[]")));
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify(bag));
    } catch {}
  }, [bag]);

  const add = useCallback((key: FragranceKey, size: Size) => {
    setBag((b) => addToBag(b, key, size));
    toast(`${FRAGRANCES[key].name} · ${size} ml added`, {
      description: `€${priceFor(key, size)} — tap the basket to review.`,
    });
  }, []);
  const change = useCallback((key: FragranceKey, size: Size, delta: number) => {
    setBag((b) => changeQty(b, key, size, delta));
  }, []);

  const showInShowroom = useCallback((key: FragranceKey) => {
    const track = document.querySelector("#experience");
    const top = track ? track.getBoundingClientRect().top + window.scrollY : 0;
    window.scrollTo({ top, behavior: "smooth" });
    setTimeout(() => apiRef.current?.go(key, true), 650);
  }, []);

  const value = useMemo<Store>(
    () => ({
      bag,
      count: bagCount(bag),
      subtotal: bagSubtotal(bag),
      add,
      change,
      bagOpen,
      setBagOpen,
      notesOpen,
      setNotesOpen,
      state,
      setState,
      apiRef,
      showInShowroom,
    }),
    [bag, add, change, bagOpen, notesOpen, state, showInShowroom],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSite must be inside SiteProvider");
  return c;
}
