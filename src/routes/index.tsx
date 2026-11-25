import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/site/Home";

const TITLE = "Unveiled Finest — The Spirits Collection";
const DESC = "Five glass fragrances in illuminated basalt niches above reflecting water. Orbit them in 3D, zoom into their notes and find your match.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
  }),
  component: Home,
});

