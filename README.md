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

It reads the connection details from two GitHub Actions secrets
(Settings → Secrets and variables → Actions):

| Secret | Value |
| --- | --- |
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` in the local `.env` |
| `SUPABASE_ANON_KEY` | Same as `VITE_SUPABASE_ANON_KEY` in the local `.env` |

If a run ever fails (including missing secrets), GitHub emails you; you can
also trigger it manually from the **Actions** tab → **Supabase keep-alive** →
**Run workflow**.

Note: GitHub disables scheduled workflows in repos with no commits for 60
days. If that happens you'll get an email and can re-enable it with one click
on the Actions tab.
