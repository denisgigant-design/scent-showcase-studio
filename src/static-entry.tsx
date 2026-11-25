// Entry for the static (GitHub Pages) build: renders the same Home page without the server.
// Built with `bun run build:static` (see vite.static.config.ts).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { Home } from "@/components/site/Home";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
