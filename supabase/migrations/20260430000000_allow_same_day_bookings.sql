-- Align the database date rule with the storefront's inclusive booking ranges.
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_check;

ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_date_order_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_date_order_check
  CHECK (end_date >= start_date);
