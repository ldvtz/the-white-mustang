CREATE TYPE booking_status AS ENUM (
  'pending',
  'confirmed',
  'active',
  'completed',
  'cancelled'
);

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
  id             uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    uuid           NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  start_date     date           NOT NULL,
  end_date       date           NOT NULL,
  status         booking_status NOT NULL DEFAULT 'pending',
  payment_method text           NOT NULL,
  total_price    numeric(10,2)  NOT NULL CHECK (total_price >= 0),
  deposit_paid   boolean        NOT NULL DEFAULT false,
  created_at     timestamptz    NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
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

CREATE INDEX idx_bookings_customer_id  ON bookings(customer_id);
CREATE INDEX idx_bookings_status       ON bookings(status);
CREATE INDEX idx_bookings_start_date   ON bookings(start_date);
CREATE INDEX idx_handover_logs_booking ON handover_logs(booking_id);
CREATE INDEX idx_media_booking         ON media(booking_id);

ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE handover_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE media         ENABLE ROW LEVEL SECURITY;
