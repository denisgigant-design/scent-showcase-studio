import { Toaster } from "@/components/ui/sonner";
import { SiteProvider } from "@/components/site/store";
import { Nav } from "@/components/site/Nav";
import { LightDesk, Showroom } from "@/components/site/Showroom";
import { NotesSheet } from "@/components/site/NotesSheet";
import { BagDrawer } from "@/components/site/BagDrawer";
import { Marquee } from "@/components/sections/Marquee";
import { CollectionCards } from "@/components/sections/CollectionCards";
import { ScentFinder } from "@/components/sections/ScentFinder";
import { LayeringLab } from "@/components/sections/LayeringLab";
import { Compare } from "@/components/sections/Compare";
import { BuiltWith } from "@/components/sections/BuiltWith";
import { Ending } from "@/components/sections/Ending";

export function Home() {
  return (
    <SiteProvider>
      <div className="intro-loader" id="loader" aria-hidden="true">
        <div className="loader-mark">UNVEILED FINEST</div>
        <div className="load-rule" />
      </div>
      <Nav />
      <LightDesk />
      <main>
        <Showroom />
        <Marquee />
        <CollectionCards />
        <ScentFinder />
        <LayeringLab />
        <Compare />
        <BuiltWith />
        <Ending />
      </main>
      <NotesSheet />
      <BagDrawer />
      <Toaster position="bottom-center" />
    </SiteProvider>
  );
}
