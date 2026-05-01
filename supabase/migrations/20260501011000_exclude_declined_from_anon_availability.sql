DROP POLICY IF EXISTS "anon_read_availability" ON bookings;

CREATE POLICY "anon_read_availability" ON bookings
  FOR SELECT TO anon USING (status::text NOT IN ('cancelled', 'declined'));
