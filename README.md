# The White Mustang

Digital storefront for [thewhitemustang.ch](https://thewhitemustang.ch) — a premium Ford Mustang GT 5.0 V8 Cabriolet hire service for weddings and weekend joyrides in the Swiss Alps.

Built with Nuxt 3, Tailwind CSS, and Supabase.

## Local Development Setup

### Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) (`npm install -g supabase`)
- Docker (required for local Supabase)

### 1. Install dependencies

```bash
npm install
```

### 2. Start local Supabase

```bash
supabase start
```

This spins up the full Supabase stack locally via Docker. Once running, you'll see output like:

```
API URL:      http://127.0.0.1:54321
DB URL:       postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL:   http://127.0.0.1:54323
Anon key:     <your-local-anon-key>
Service key:  <your-local-service-role-key>
```

Copy the `API URL` and `Anon key` into your `.env` file:

```env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_KEY=<anon-key-from-above>
```

To stop Supabase:

```bash
supabase stop
```

To reset the local database (apply all migrations from scratch):

```bash
supabase db reset
```

### 3. Regenerate TypeScript types (when schema changes)

```bash
npx supabase gen types typescript --project-id the-white-mustang > types/supabase.ts
```

### 4. Start the Nuxt dev server

```bash
npm run dev
```

The app is available at `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run preview
```

## Architecture

| Concern | Choice | Why |
|---|---|---|
| Framework | Nuxt 3 | SSR, file-based routing, built-in i18n support |
| Styling | Tailwind CSS | Utility-first, no runtime overhead |
| Database / Auth | Supabase | Postgres with RLS, real-time, and managed auth |
| i18n | `@nuxtjs/i18n` | DE (default) + EN with `$t()` composable |
| Data fetching | `useFetch` / `useAsyncData` | Server-side caching, avoids client-side Supabase calls |
| Images | `/public` or CDN | Heavy vehicle images are not stored in the database |
