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
NUXT_BOOKING_CANCELLATION_CUTOFF_DAYS=3
NUXT_TWINT_PAYMENT_RECIPIENT="The White Mustang"
NUXT_TWINT_PAYMENT_NOTE="Booking reference"
NUXT_TWINT_QR_IMAGE_URL=
NUXT_BANK_TRANSFER_ACCOUNT_NAME="The White Mustang"
NUXT_BANK_TRANSFER_IBAN="CH00 0000 0000 0000 0000 0"
NUXT_BANK_TRANSFER_NOTE="Booking reference"
```

The `NUXT_SUPABASE_SECRET_KEY` service role key is used only inside protected server routes. Never expose it to the browser.

To stop Supabase:

```bash
npx supabase stop
```

To reset the local database (apply all migrations from scratch):

```bash
npx supabase db reset
```

To only apply new migrations:

```bash
npx supabase migration up
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

The storefront includes a manual-payment booking request flow in the pricing calendar section. Customers select a use case, start date, return date, contact details, payment method, and optional comment; the app calculates a CHF estimate and stores the request in Supabase. Booking ranges are inclusive, so same-day bookings are valid.

Supported payment methods are `twint`, `bank_transfer`, and `cash`. Payment execution is intentionally manual:

- `twint` bookings start as `pending` until the admin confirms payment.
- `bank_transfer` bookings start as `awaiting_payment` until the admin marks payment received.
- `cash` bookings start as `confirmed` with the deposit marked unpaid.

Each booking receives a secure customer management link. The raw token is only returned/sent to the customer; the database stores a hash. Customers can add comments and cancel `pending`, `awaiting_payment`, or `confirmed` bookings until `NUXT_BOOKING_CANCELLATION_CUTOFF_DAYS` days before the start date. Confirmed or paid cancellations are flagged for manual refund handling.

Public booking endpoints:

| Endpoint | Purpose |
|---|---|
| `GET /api/availability` | Returns unavailable calendar dates derived from active bookings and blocked dates |
| `POST /api/bookings` | Validates the request, upserts the customer by email, recalculates the price server-side, rejects unavailable ranges, creates the booking, stores the initial comment, and returns payment instructions plus a management link |
| `GET /api/bookings/manage/:token` | Returns minimal booking, payment, comment, and cancellation details for a valid management token |
| `POST /api/bookings/manage/:token/comments` | Adds a customer-visible comment |
| `POST /api/bookings/manage/:token/cancel` | Cancels an eligible booking before the configured cutoff |

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
| Images | Production Mustang photos in `/public/images` | Heavy vehicle images are served by the frontend CDN, not Supabase Storage |
| Payments | Manual TWINT / bank transfer / cash | Keeps launch scope simple while preserving admin confirmation and refund handling |
| Customer booking access | Hashed magic-link token | No customer account required; direct lookup by personal data is avoided |
