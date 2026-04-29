-- Add awaiting_payment status for bank-transfer bookings
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_payment';

-- Blocked dates for calendar management (maintenance, personal use, etc.)
CREATE TABLE blocked_dates (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  date       date        NOT NULL UNIQUE,
  reason     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_blocked_dates_date ON blocked_dates(date);

ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Auto-set initial booking state based on payment method:
--   bank_transfer → awaiting_payment (admin must confirm receipt)
--   cash  → confirmed (pay at handover), deposit flagged as unpaid
--   twint → stays pending (admin toggles to confirmed after TWINT notification)
CREATE OR REPLACE FUNCTION set_initial_booking_state()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_method = 'bank_transfer' THEN
    NEW.status := 'awaiting_payment';
  ELSIF NEW.payment_method = 'cash' THEN
    NEW.status := 'confirmed';
    NEW.deposit_paid := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_initial_state
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_initial_booking_state();
