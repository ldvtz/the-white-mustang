ALTER TABLE bookings
  ADD COLUMN locale text NOT NULL DEFAULT 'de' CHECK (locale IN ('de', 'en'));
