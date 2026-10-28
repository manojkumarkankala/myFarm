/*
# AgriRent - Agricultural Equipment Rental Platform Schema

## Overview
Creates the complete database schema for an agricultural equipment rental platform
where farmers can book drones, harvesters, tractors, and other farming equipment.

## New Tables
1. `profiles` - Owner/business info and admin user profile (linked to auth.users)
2. `website_settings` - Branding, theme colors, contact info, social links (singleton)
3. `equipment` - Machinery listings (drones, harvesters, tractors, etc.)
4. `equipment_images` - Multiple images per equipment
5. `services` - Agricultural services offered (can be linked to equipment or standalone)
6. `gallery` - Gallery images and videos with categories
7. `availability` - Working hours, blocked dates, maintenance periods per equipment
8. `bookings` - Customer booking requests with status lifecycle
9. `booking_status_history` - Audit trail of booking status changes
10. `testimonials` - Customer reviews
11. `faqs` - Frequently asked questions
12. `enquiries` - Contact form submissions

## Security (RLS)
- Public (anon) can READ published content: active equipment, published gallery,
  approved testimonials, published FAQs, website settings, owner profile.
- Public (anon) can INSERT bookings and enquiries (with validation).
- Admin users (role='admin' in JWT app_metadata) can do full CRUD on all tables.
- Customers cannot read other customers' bookings or personal info.
- Admin role is verified server-side via auth.jwt() app_metadata (user-immutable).

## Important Notes
1. Admin role stored in raw_app_meta_data (set by secure edge function during setup).
2. Booking insert is done via SECURITY DEFINER function to atomically check availability.
3. Admin approval also rechecks availability to prevent overlaps.
4. All timestamps in timestamptz with sensible defaults.
*/

-- ============ PROFILES TABLE ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  owner_name text,
  owner_photo text,
  business_name text,
  biography text,
  farming_experience text,
  mobile_number text,
  whatsapp_number text,
  email_address text,
  business_address text,
  village_town text,
  service_areas text,
  working_hours text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============ WEBSITE_SETTINGS TABLE (singleton) ============
CREATE TABLE IF NOT EXISTS website_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name text NOT NULL DEFAULT 'AgriRent – Agricultural Equipment Booking',
  logo_url text,
  favicon_url text,
  hero_title text NOT NULL DEFAULT 'Book Agricultural Equipment for Your Farming Needs',
  hero_description text,
  hero_image_url text,
  hero_video_url text,
  primary_color text DEFAULT '#16a34a',
  secondary_color text DEFAULT '#fef9c3',
  accent_color text DEFAULT '#facc15',
  contact_email text,
  contact_phone text,
  business_address text,
  service_areas text,
  footer_content text,
  facebook_url text,
  instagram_url text,
  youtube_url text,
  twitter_url text,
  about_title text,
  about_description text,
  why_choose_us text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE website_settings ENABLE ROW LEVEL SECURITY;

-- ============ EQUIPMENT TABLE ============
CREATE TABLE IF NOT EXISTS equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  slug text UNIQUE,
  main_image_url text,
  description text,
  specifications jsonb DEFAULT '{}'::jsonb,
  price numeric NOT NULL DEFAULT 0,
  pricing_unit text DEFAULT 'per acre',
  min_booking_duration text,
  service_locations text,
  availability_status text DEFAULT 'available',
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_active ON equipment(is_active);

-- ============ EQUIPMENT_IMAGES TABLE ============
CREATE TABLE IF NOT EXISTS equipment_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES equipment(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE equipment_images ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_equipment_images_eq ON equipment_images(equipment_id);

-- ============ SERVICES TABLE ============
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES equipment(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  pricing_unit text DEFAULT 'per acre',
  is_published boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- ============ GALLERY TABLE ============
CREATE TABLE IF NOT EXISTS gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  media_url text NOT NULL,
  thumbnail_url text,
  category text,
  equipment_type text,
  location text,
  event_date date,
  description text,
  is_published boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
CREATE INDEX IF NOT EXISTS idx_gallery_published ON gallery(is_published);

-- ============ AVAILABILITY TABLE ============
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id uuid REFERENCES equipment(id) ON DELETE CASCADE,
  rule_type text NOT NULL DEFAULT 'working_hours',
  day_of_week int,
  start_time time,
  end_time time,
  blocked_date date,
  blocked_start_time time,
  blocked_end_time time,
  reason text,
  is_recurring boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_availability_eq ON availability(equipment_id);
CREATE INDEX IF NOT EXISTS idx_availability_blocked_date ON availability(blocked_date);

-- ============ BOOKINGS TABLE ============
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_mobile text NOT NULL,
  customer_whatsapp text,
  equipment_id uuid REFERENCES equipment(id) ON DELETE SET NULL,
  equipment_name text,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  farm_village text NOT NULL,
  farm_address text,
  land_area numeric NOT NULL,
  land_area_unit text NOT NULL DEFAULT 'acres',
  crop_type text,
  work_required text,
  additional_requirements text,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  admin_notes text,
  total_price numeric,
  submitted_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_equipment ON bookings(equipment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(reference_number);

-- ============ BOOKING_STATUS_HISTORY TABLE ============
CREATE TABLE IF NOT EXISTS booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid,
  reason text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_history_booking ON booking_status_history(booking_id);

-- ============ TESTIMONIALS TABLE ============
CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_photo text,
  rating int DEFAULT 5,
  review text NOT NULL,
  location text,
  is_published boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- ============ FAQS TABLE ============
CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text,
  is_published boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- ============ ENQUIRIES TABLE ============
CREATE TABLE IF NOT EXISTS enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  subject text,
  message text NOT NULL,
  status text DEFAULT 'new',
  admin_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTION: is_admin() - checks JWT app_metadata role
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ============================================================
-- BOOKING REFERENCE NUMBER GENERATOR
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ref text;
  attempts int := 0;
BEGIN
  LOOP
    ref := 'AGR' || to_char(now(), 'YYMMDD') || lpad(floor(random() * 10000)::text, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM bookings WHERE reference_number = ref);
    attempts := attempts + 1;
    IF attempts > 10 THEN
      ref := 'AGR' || to_char(now(), 'YYMMDDHH24MISS');
      EXIT;
    END IF;
  END LOOP;
  RETURN ref;
END;
$$;

-- ============================================================
-- CHECK BOOKING OVERLAP - returns true if overlap exists
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_booking_overlap(
  p_equipment_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time,
  p_exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE equipment_id = p_equipment_id
      AND booking_date = p_booking_date
      AND status IN ('approved', 'pending')
      AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
      AND start_time < p_end_time
      AND end_time > p_start_time
  );
$$;

-- ============================================================
-- CHECK BLOCKED DATE/SLOT
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_slot_blocked(
  p_equipment_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM availability
    WHERE equipment_id = p_equipment_id
      AND rule_type = 'block'
      AND (
        (blocked_date = p_booking_date) OR
        (is_recurring = true AND day_of_week = extract(dow from p_booking_date)::int)
      )
      AND blocked_start_time < p_end_time
      AND blocked_end_time > p_start_time
  );
$$;

-- ============================================================
-- CREATE BOOKING - SECURITY DEFINER (atomic availability check)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_booking(
  p_customer_name text,
  p_customer_mobile text,
  p_customer_whatsapp text,
  p_equipment_id uuid,
  p_booking_date date,
  p_start_time time,
  p_end_time time,
  p_farm_village text,
  p_farm_address text,
  p_land_area numeric,
  p_land_area_unit text,
  p_crop_type text,
  p_work_required text,
  p_additional_requirements text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_equipment equipment%ROWTYPE;
  v_ref text;
  v_overlap boolean;
  v_blocked boolean;
BEGIN
  SELECT * INTO v_equipment FROM equipment WHERE id = p_equipment_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Selected equipment is not available.');
  END IF;

  IF p_booking_date < current_date THEN
    RETURN jsonb_build_object('error', 'Cannot book for a past date.');
  END IF;

  IF p_end_time <= p_start_time THEN
    RETURN jsonb_build_object('error', 'End time must be after start time.');
  END IF;

  SELECT public.has_booking_overlap(p_equipment_id, p_booking_date, p_start_time, p_end_time) INTO v_overlap;
  IF v_overlap THEN
    RETURN jsonb_build_object('error', 'This time slot is already booked for the selected equipment. Please choose a different date or time.');
  END IF;

  SELECT public.is_slot_blocked(p_equipment_id, p_booking_date, p_start_time, p_end_time) INTO v_blocked;
  IF v_blocked THEN
    RETURN jsonb_build_object('error', 'This time slot is blocked (maintenance or unavailable). Please choose a different time.');
  END IF;

  v_ref := public.generate_booking_reference();

  INSERT INTO bookings (
    reference_number, customer_name, customer_mobile, customer_whatsapp,
    equipment_id, equipment_name, booking_date, start_time, end_time,
    farm_village, farm_address, land_area, land_area_unit, crop_type,
    work_required, additional_requirements, status, total_price
  ) VALUES (
    v_ref, p_customer_name, p_customer_mobile, p_customer_whatsapp,
    p_equipment_id, v_equipment.name, p_booking_date, p_start_time, p_end_time,
    p_farm_village, p_farm_address, p_land_area, p_land_area_unit, p_crop_type,
    p_work_required, p_additional_requirements, 'pending', v_equipment.price * p_land_area
  ) RETURNING * INTO v_booking;

  INSERT INTO booking_status_history (booking_id, previous_status, new_status, reason)
  VALUES (v_booking.id, NULL, 'pending', 'Booking request submitted');

  RETURN jsonb_build_object('success', true, 'booking', to_jsonb(v_booking));
END;
$$;

-- ============================================================
-- ADMIN APPROVE BOOKING - rechecks availability then approves
-- ============================================================
CREATE OR REPLACE FUNCTION public.approve_booking(p_booking_id uuid, p_admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_overlap boolean;
  v_blocked boolean;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Booking not found.');
  END IF;

  IF v_booking.status NOT IN ('pending', 'rejected') THEN
    RETURN jsonb_build_object('error', 'Only pending or rejected bookings can be approved.');
  END IF;

  SELECT public.has_booking_overlap(v_booking.equipment_id, v_booking.booking_date, v_booking.start_time, v_booking.end_time, p_booking_id) INTO v_overlap;
  IF v_overlap THEN
    RETURN jsonb_build_object('error', 'Cannot approve: this time slot overlaps with another approved booking.');
  END IF;

  SELECT public.is_slot_blocked(v_booking.equipment_id, v_booking.booking_date, v_booking.start_time, v_booking.end_time) INTO v_blocked;
  IF v_blocked THEN
    RETURN jsonb_build_object('error', 'Cannot approve: this time slot is blocked.');
  END IF;

  UPDATE bookings SET status = 'approved', approved_at = now(), updated_at = now()
  WHERE id = p_booking_id RETURNING * INTO v_booking;

  INSERT INTO booking_status_history (booking_id, previous_status, new_status, changed_by, reason)
  VALUES (p_booking_id, 'pending', 'approved', p_admin_id, 'Booking approved by admin');

  RETURN jsonb_build_object('success', true, 'booking', to_jsonb(v_booking));
END;
$$;

-- ============================================================
-- UPDATE BOOKING STATUS (reject, cancel, complete, reschedule)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_booking_status(
  p_booking_id uuid,
  p_new_status text,
  p_reason text,
  p_admin_id uuid,
  p_new_date date DEFAULT NULL,
  p_new_start time DEFAULT NULL,
  p_new_end time DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_old_status text;
  v_overlap boolean;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Booking not found.');
  END IF;

  v_old_status := v_booking.status;

  IF p_new_status = 'rescheduled' THEN
    IF p_new_date IS NULL OR p_new_start IS NULL OR p_new_end IS NULL THEN
      RETURN jsonb_build_object('error', 'New date and times required for reschedule.');
    END IF;
    SELECT public.has_booking_overlap(v_booking.equipment_id, p_new_date, p_new_start, p_new_end, p_booking_id) INTO v_overlap;
    IF v_overlap THEN
      RETURN jsonb_build_object('error', 'Rescheduled slot overlaps with another booking.');
    END IF;
    UPDATE bookings SET booking_date = p_new_date, start_time = p_new_start, end_time = p_new_end, status = 'pending', updated_at = now()
    WHERE id = p_booking_id RETURNING * INTO v_booking;
  ELSIF p_new_status = 'rejected' THEN
    UPDATE bookings SET status = 'rejected', rejection_reason = p_reason, updated_at = now()
    WHERE id = p_booking_id RETURNING * INTO v_booking;
  ELSIF p_new_status = 'cancelled' THEN
    UPDATE bookings SET status = 'cancelled', cancelled_at = now(), updated_at = now()
    WHERE id = p_booking_id RETURNING * INTO v_booking;
  ELSIF p_new_status = 'completed' THEN
    UPDATE bookings SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE id = p_booking_id RETURNING * INTO v_booking;
  ELSE
    RETURN jsonb_build_object('error', 'Unknown status.');
  END IF;

  INSERT INTO booking_status_history (booking_id, previous_status, new_status, changed_by, reason)
  VALUES (p_booking_id, v_old_status, p_new_status, p_admin_id, p_reason);

  RETURN jsonb_build_object('success', true, 'booking', to_jsonb(v_booking));
END;
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ===== PROFILES =====
DROP POLICY IF EXISTS "public_read_profile" ON profiles;
CREATE POLICY "public_read_profile" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_profile" ON profiles;
CREATE POLICY "admin_update_profile" ON profiles FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_profile" ON profiles;
CREATE POLICY "admin_insert_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_profile" ON profiles;
CREATE POLICY "admin_delete_profile" ON profiles FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== WEBSITE_SETTINGS =====
DROP POLICY IF EXISTS "public_read_settings" ON website_settings;
CREATE POLICY "public_read_settings" ON website_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_settings" ON website_settings;
CREATE POLICY "admin_insert_settings" ON website_settings FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_settings" ON website_settings;
CREATE POLICY "admin_update_settings" ON website_settings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_settings" ON website_settings;
CREATE POLICY "admin_delete_settings" ON website_settings FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== EQUIPMENT =====
DROP POLICY IF EXISTS "public_read_equipment" ON equipment;
CREATE POLICY "public_read_equipment" ON equipment FOR SELECT
  TO anon, authenticated USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_equipment" ON equipment;
CREATE POLICY "admin_insert_equipment" ON equipment FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_equipment" ON equipment;
CREATE POLICY "admin_update_equipment" ON equipment FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_equipment" ON equipment;
CREATE POLICY "admin_delete_equipment" ON equipment FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== EQUIPMENT_IMAGES =====
DROP POLICY IF EXISTS "public_read_equipment_images" ON equipment_images;
CREATE POLICY "public_read_equipment_images" ON equipment_images FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_equipment_images" ON equipment_images;
CREATE POLICY "admin_insert_equipment_images" ON equipment_images FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_equipment_images" ON equipment_images;
CREATE POLICY "admin_update_equipment_images" ON equipment_images FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_equipment_images" ON equipment_images;
CREATE POLICY "admin_delete_equipment_images" ON equipment_images FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== SERVICES =====
DROP POLICY IF EXISTS "public_read_services" ON services;
CREATE POLICY "public_read_services" ON services FOR SELECT
  TO anon, authenticated USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_services" ON services;
CREATE POLICY "admin_insert_services" ON services FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_services" ON services;
CREATE POLICY "admin_update_services" ON services FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_services" ON services;
CREATE POLICY "admin_delete_services" ON services FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== GALLERY =====
DROP POLICY IF EXISTS "public_read_gallery" ON gallery;
CREATE POLICY "public_read_gallery" ON gallery FOR SELECT
  TO anon, authenticated USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_gallery" ON gallery;
CREATE POLICY "admin_insert_gallery" ON gallery FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_gallery" ON gallery;
CREATE POLICY "admin_update_gallery" ON gallery FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_gallery" ON gallery;
CREATE POLICY "admin_delete_gallery" ON gallery FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== AVAILABILITY =====
DROP POLICY IF EXISTS "public_read_availability" ON availability;
CREATE POLICY "public_read_availability" ON availability FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_availability" ON availability;
CREATE POLICY "admin_insert_availability" ON availability FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_availability" ON availability;
CREATE POLICY "admin_update_availability" ON availability FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_availability" ON availability;
CREATE POLICY "admin_delete_availability" ON availability FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== BOOKINGS =====
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_select_bookings" ON bookings;
CREATE POLICY "admin_select_bookings" ON bookings FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_bookings" ON bookings;
CREATE POLICY "admin_update_bookings" ON bookings FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_bookings" ON bookings;
CREATE POLICY "admin_delete_bookings" ON bookings FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== BOOKING_STATUS_HISTORY =====
DROP POLICY IF EXISTS "admin_read_history" ON booking_status_history;
CREATE POLICY "admin_read_history" ON booking_status_history FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_insert_history" ON booking_status_history;
CREATE POLICY "admin_insert_history" ON booking_status_history FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_history" ON booking_status_history;
CREATE POLICY "admin_delete_history" ON booking_status_history FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== TESTIMONIALS =====
DROP POLICY IF EXISTS "public_read_testimonials" ON testimonials;
CREATE POLICY "public_read_testimonials" ON testimonials FOR SELECT
  TO anon, authenticated USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_testimonials" ON testimonials;
CREATE POLICY "admin_insert_testimonials" ON testimonials FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_testimonials" ON testimonials;
CREATE POLICY "admin_update_testimonials" ON testimonials FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_testimonials" ON testimonials;
CREATE POLICY "admin_delete_testimonials" ON testimonials FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== FAQS =====
DROP POLICY IF EXISTS "public_read_faqs" ON faqs;
CREATE POLICY "public_read_faqs" ON faqs FOR SELECT
  TO anon, authenticated USING (is_published = true OR public.is_admin());

DROP POLICY IF EXISTS "admin_insert_faqs" ON faqs;
CREATE POLICY "admin_insert_faqs" ON faqs FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_faqs" ON faqs;
CREATE POLICY "admin_update_faqs" ON faqs FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_faqs" ON faqs;
CREATE POLICY "admin_delete_faqs" ON faqs FOR DELETE
  TO authenticated USING (public.is_admin());

-- ===== ENQUIRIES =====
DROP POLICY IF EXISTS "anon_insert_enquiries" ON enquiries;
CREATE POLICY "anon_insert_enquiries" ON enquiries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "admin_read_enquiries" ON enquiries;
CREATE POLICY "admin_read_enquiries" ON enquiries FOR SELECT
  TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admin_update_enquiries" ON enquiries;
CREATE POLICY "admin_update_enquiries" ON enquiries FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_enquiries" ON enquiries;
CREATE POLICY "admin_delete_enquiries" ON enquiries FOR DELETE
  TO authenticated USING (public.is_admin());
