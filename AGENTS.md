<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Showroom architecture
- The page body lives in `src/components/site/Home.tsx`; both the app route and `src/static-entry.tsx` (static GitHub Pages build, `bun run build:static` → `dist-static/`) render it. Why: one page, two hosting targets.
- The WebGL showroom engine and the small bottle viewer are plain ES modules in `public/showroom/` loaded at runtime, not bundled. Why: they share one three.js bundle and must keep working unchanged on static hosts.
- Every asset URL goes through `import.meta.env.BASE_URL` (or a relative CSS `url()`), never a hard-coded `/…` path in TS. Why: GitHub Pages serves the site from `/<repo>/`.
- Bottle imagery outside the showroom uses `<Bottle3D>` (live GLB), not the PNG previews. Why: the user rejected the pixelated photos.
