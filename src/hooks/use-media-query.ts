import { useSyncExternalStore } from "react";

/** Live media query — re-renders the moment the browser switches between desktop and phone views. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = matchMedia(query);
      mql.addEventListener("change", cb);
      window.addEventListener("resize", cb);
      return () => {
        mql.removeEventListener("change", cb);
        window.removeEventListener("resize", cb);
      };
    },
    () => matchMedia(query).matches,
    () => false,
  );
}
