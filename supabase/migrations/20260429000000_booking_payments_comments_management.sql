-- Normalize manual payment methods and add customer self-service booking management.

UPDATE bookings
SET payment_method = 'bank_transfer'
WHERE payment_method IN ('iban', 'deferred');

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by text CHECK (cancelled_by IS NULL OR cancelled_by IN ('customer', 'admin')),
  ADD COLUMN IF NOT EXISTS cancellation_note text,
  ADD COLUMN IF NOT EXISTS refund_handling_required boolean NOT NULL DEFAULT false;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IN ('twint', 'bank_transfer', 'cash'));

-- Auto-set initial booking state based on payment method:
--   bank_transfer -> awaiting_payment (admin must confirm receipt)
--   cash          -> confirmed (pay at handover), deposit flagged as unpaid
--   twint         -> pending (admin toggles to confirmed after TWINT notification)
CREATE OR REPLACE FUNCTION set_initial_booking_state()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_method = 'bank_transfer' THEN
    NEW.status := 'awaiting_payment';
    NEW.deposit_paid := false;
  ELSIF NEW.payment_method = 'cash' THEN
    NEW.status := 'confirmed';
    NEW.deposit_paid := false;
  ELSIF NEW.payment_method = 'twint' THEN
    NEW.status := 'pending';
    NEW.deposit_paid := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE booking_comments (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  author_type         text        NOT NULL CHECK (author_type IN ('customer', 'admin', 'system')),
  message             text        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1200),
  visible_to_customer boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_comments_booking_id ON booking_comments(booking_id);
CREATE INDEX idx_booking_comments_created_at ON booking_comments(created_at);

ALTER TABLE booking_comments ENABLE ROW LEVEL SECURITY;

CREATE TABLE booking_management_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  token_hash  text        NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_management_tokens_booking_id ON booking_management_tokens(booking_id);
CREATE INDEX idx_booking_management_tokens_expires_at ON booking_management_tokens(expires_at);

ALTER TABLE booking_management_tokens ENABLE ROW LEVEL SECURITY;
