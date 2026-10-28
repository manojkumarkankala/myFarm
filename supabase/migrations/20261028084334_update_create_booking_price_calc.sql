-- Update create_booking to calculate total_price based on the equipment's pricing unit
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
  v_total_price numeric;
  v_area_acres numeric;
  v_hours numeric;
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

  -- Calculate price based on pricing unit
  v_area_acres := CASE
    WHEN p_land_area_unit = 'hectares' THEN p_land_area * 2.471
    ELSE p_land_area
  END;

  v_hours := GREATEST(1, extract(epoch FROM (p_end_time - p_start_time)) / 3600.0);

  v_total_price := CASE
    WHEN v_equipment.pricing_unit ILIKE '%hour%' THEN ROUND(v_equipment.price * v_hours)
    WHEN v_equipment.pricing_unit ILIKE '%acre%' THEN ROUND(v_equipment.price * v_area_acres)
    ELSE v_equipment.price
  END;

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
    p_work_required, p_additional_requirements, 'pending', v_total_price
  ) RETURNING * INTO v_booking;

  INSERT INTO booking_status_history (booking_id, previous_status, new_status, reason)
  VALUES (v_booking.id, NULL, 'pending', 'Booking request submitted');

  RETURN jsonb_build_object('success', true, 'booking', to_jsonb(v_booking));
END;
$$;
