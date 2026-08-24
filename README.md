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

**One-time setup** — add two repository secrets on GitHub
(Settings → Secrets and variables → Actions → New repository secret):

| Secret | Value |
| --- | --- |
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` in your local `.env` (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Same as `VITE_SUPABASE_ANON_KEY` in your local `.env` |

Then open the repo's **Actions** tab → **Supabase keep-alive** → **Run
workflow** once to confirm it passes. After that it runs on its own; if a run
ever fails, GitHub emails you.

Note: GitHub disables scheduled workflows in repos with no commits for 60
days. If that happens you'll get an email and can re-enable it with one click
on the Actions tab.
