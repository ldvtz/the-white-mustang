-- ============================================================
-- The White Mustang — initial schema
-- ============================================================

-- ─── Types ────────────────────────────────────────────────────

CREATE TYPE booking_status AS ENUM (
  'pending',
  'awaiting_payment',
  'confirmed',
  'active',
  'completed',
  'cancelled'
);

-- ─── Tables ───────────────────────────────────────────────────

CREATE TABLE customers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  email       text        NOT NULL UNIQUE,
  phone       text,
  nationality text,
  age         smallint    CHECK (age IS NULL OR age BETWEEN 18 AND 120),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bookings (
  id                       uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id              uuid           NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  start_date               date           NOT NULL,
  end_date                 date           NOT NULL,
  status                   booking_status NOT NULL DEFAULT 'pending',
  payment_method           text           NOT NULL CHECK (payment_method IN ('twint', 'bank_transfer', 'cash')),
  total_price              numeric(10,2)  NOT NULL CHECK (total_price >= 0),
  deposit_paid             boolean        NOT NULL DEFAULT false,
  payment_received_at      timestamptz,
  cancelled_at             timestamptz,
  cancelled_by             text           CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer', 'admin')),
  cancellation_note        text,
  refund_handling_required boolean        NOT NULL DEFAULT false,
  created_at               timestamptz    NOT NULL DEFAULT now(),
  CONSTRAINT bookings_date_order_check CHECK (end_date >= start_date)
);

CREATE TABLE handover_logs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  mileage_start    integer     NOT NULL CHECK (mileage_start >= 0),
  mileage_end      integer     CHECK (mileage_end IS NULL OR mileage_end >= mileage_start),
  fuel_level_start smallint    NOT NULL CHECK (fuel_level_start BETWEEN 0 AND 8),
  fuel_level_end   smallint    CHECK (fuel_level_end IS NULL OR fuel_level_end BETWEEN 0 AND 8),
  damage_notes     text,
  signature_svg    text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE media (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  file_path   text        NOT NULL,
  file_type   text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE blocked_dates (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date       date        NOT NULL UNIQUE,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE booking_comments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  author_type         text        NOT NULL CHECK (author_type IN ('customer', 'admin', 'system')),
  message             text        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1200),
  visible_to_customer boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE booking_management_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  token_hash  text        NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────

CREATE INDEX idx_bookings_customer_id         ON bookings(customer_id);
CREATE INDEX idx_bookings_status              ON bookings(status);
CREATE INDEX idx_bookings_start_date          ON bookings(start_date);
CREATE INDEX idx_bookings_payment_received_at ON bookings(payment_received_at);
CREATE INDEX idx_bookings_cancelled_at        ON bookings(cancelled_at);

CREATE INDEX idx_handover_logs_booking        ON handover_logs(booking_id);
CREATE INDEX idx_media_booking                ON media(booking_id);
CREATE INDEX idx_blocked_dates_date           ON blocked_dates(date);

CREATE INDEX idx_booking_comments_booking_id  ON booking_comments(booking_id);
CREATE INDEX idx_booking_comments_created_at  ON booking_comments(created_at);

CREATE INDEX idx_mgmt_tokens_booking_id       ON booking_management_tokens(booking_id);
CREATE INDEX idx_mgmt_tokens_expires_at       ON booking_management_tokens(expires_at);
CREATE INDEX idx_mgmt_tokens_revoked_at       ON booking_management_tokens(revoked_at);

-- ─── Trigger: auto-set initial booking state on insert ─────────
--   bank_transfer → awaiting_payment (admin confirms bank receipt)
--   cash          → confirmed        (pay at handover)
--   twint         → pending          (admin confirms after TWINT notification)

CREATE OR REPLACE FUNCTION set_initial_booking_state()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_method = 'bank_transfer' THEN
    NEW.status       := 'awaiting_payment';
    NEW.deposit_paid := false;
  ELSIF NEW.payment_method = 'cash' THEN
    NEW.status       := 'confirmed';
    NEW.deposit_paid := false;
  ELSIF NEW.payment_method = 'twint' THEN
    NEW.status       := 'pending';
    NEW.deposit_paid := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_initial_state
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_initial_booking_state();

-- ─── Row Level Security ────────────────────────────────────────
--
-- Access model:
--   service role  — used by all Nuxt server routes; bypasses RLS entirely.
--   admin JWT     — authenticated Supabase user with app_metadata.role = 'admin';
--                   full access to every table via the policies below.
--   anon / public — no session; read-only access to the two tables needed for
--                   the public calendar (blocked_dates, bookings date ranges).
--                   All other data is served exclusively through service-role
--                   server routes, so no additional anon policies are needed.

ALTER TABLE customers                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE media                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates             ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_management_tokens ENABLE ROW LEVEL SECURITY;

-- Helper: returns true when the JWT belongs to an admin.
-- app_metadata is set server-side via service role and cannot be modified by users.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- customers: admin only
CREATE POLICY "admin_all" ON customers
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- bookings: admin full access + anon read for availability calendar
CREATE POLICY "admin_all" ON bookings
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "anon_read_availability" ON bookings
  FOR SELECT TO anon USING (status != 'cancelled');

-- blocked_dates: admin full access + anon read for calendar display
CREATE POLICY "admin_all" ON blocked_dates
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "anon_read" ON blocked_dates
  FOR SELECT TO anon USING (true);

-- remaining tables: admin only (all access is via service-role server routes)
CREATE POLICY "admin_all" ON handover_logs
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin_all" ON media
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin_all" ON booking_comments
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "admin_all" ON booking_management_tokens
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
