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
NUXT_SUPABASE_SECRET_KEY=<service-role-key-from-above>
```

The `NUXT_SUPABASE_SECRET_KEY` service role key is used only inside protected server routes. Never expose it to the browser.

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

## Admin Authentication

All pages under `/admin` are protected by Supabase Auth. The login page lives at `/admin/login`, and all `/api/admin/*` server routes verify the active Supabase session before using the service role client.

Admin access is granted through Supabase Auth `app_metadata`. A user is treated as an admin when one of these markers exists:

```json
{ "role": "admin" }
```

```json
{ "admin": true }
```

```json
{ "roles": ["admin"] }
```

Set this metadata from Supabase Studio, a trusted admin script, or another service-role-only flow. Do not use `user_metadata` for admin privileges because users can update it themselves.

## Public Booking Requests

The storefront includes a no-payment booking request flow in the pricing calendar section. Customers select a use case, start date, return date, and contact details; the app calculates a non-binding CHF estimate and stores the request in Supabase.

Payment execution is intentionally not implemented yet. New public requests are inserted with `payment_method = deferred`, `status = pending`, and `deposit_paid = false` so the admin dashboard can handle them manually until the payment slice is added.

Public booking endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /api/availability` | Returns unavailable calendar dates derived from active bookings and blocked dates |
| `POST /api/bookings` | Validates the request, upserts the customer by email, recalculates the price server-side, rejects unavailable ranges, and creates a pending booking |

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
| Admin access | Supabase Auth `app_metadata` + Nuxt route middleware | Pages and server endpoints both verify admin sessions |
| i18n | `@nuxtjs/i18n` | DE (default) + EN with `$t()` composable |
| Data fetching | `useFetch` / `useAsyncData` | Server-side caching; public booking routes expose only validated, minimal data |
| Images | `/public` or CDN | Heavy vehicle images are not stored in the database |
