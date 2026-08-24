# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Supabase keep-alive (free-tier pause prevention)

Supabase pauses free-tier projects after 7 days without activity. The
`.github/workflows/supabase-keepalive.yml` workflow prevents this by running a
tiny read query against the database every Monday and Thursday.

No setup needed — the project URL and publishable (anon) key are baked into
the workflow as defaults. Those values are public by design (they ship in the
app's browser bundle) and row-level security protects the data. If you ever
rotate keys, either update the defaults in the workflow or add
`SUPABASE_URL` / `SUPABASE_ANON_KEY` repository secrets
(Settings → Secrets and variables → Actions), which take precedence.

If a run ever fails, GitHub emails you; you can also trigger it manually from
the **Actions** tab → **Supabase keep-alive** → **Run workflow**.

Note: GitHub disables scheduled workflows in repos with no commits for 60
days. If that happens you'll get an email and can re-enable it with one click
on the Actions tab.
