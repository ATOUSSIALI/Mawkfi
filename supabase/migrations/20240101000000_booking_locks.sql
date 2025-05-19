-- Create a table for booking locks
CREATE TABLE IF NOT EXISTS booking_locks (
  parking_slot_id UUID PRIMARY KEY,
  locked_until TIMESTAMPTZ NOT NULL,
  locked_by UUID REFERENCES auth.users(id)
);

-- Function to acquire a lock
CREATE OR REPLACE FUNCTION acquire_booking_lock(
  p_parking_slot_id UUID,
  p_user_id UUID,
  p_lock_duration_seconds INT DEFAULT 60
) RETURNS BOOLEAN AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_lock_until TIMESTAMPTZ := v_now + (p_lock_duration_seconds || ' seconds')::INTERVAL;
BEGIN
  -- Try to insert a new lock or update an expired one
  INSERT INTO booking_locks (parking_slot_id, locked_until, locked_by)
  VALUES (p_parking_slot_id, v_lock_until, p_user_id)
  ON CONFLICT (parking_slot_id) DO UPDATE
  SET locked_until = v_lock_until, locked_by = p_user_id
  WHERE booking_locks.locked_until < v_now;
  
  -- Check if we got the lock
  RETURN EXISTS (
    SELECT 1 FROM booking_locks
    WHERE parking_slot_id = p_parking_slot_id
    AND locked_by = p_user_id
    AND locked_until > v_now
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release a lock
CREATE OR REPLACE FUNCTION release_booking_lock(
  p_parking_slot_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM booking_locks
  WHERE parking_slot_id = p_parking_slot_id
  AND locked_by = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check for booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's an overlapping active booking for the same parking slot
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE 
      parking_slot_id = NEW.parking_slot_id
      AND is_active = true
      AND id != NEW.id  -- Exclude the current booking (important for updates)
      AND (
        (start_time <= NEW.end_time AND end_time >= NEW.start_time)
      )
  ) THEN
    RAISE EXCEPTION 'Booking conflict: This parking slot is already booked for the requested time period.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to run the function before insert or update
DROP TRIGGER IF EXISTS prevent_booking_conflict ON bookings;
CREATE TRIGGER prevent_booking_conflict
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION check_booking_conflict();

-- Create a stored procedure for atomic booking creation
CREATE OR REPLACE FUNCTION create_booking_transaction(
  p_user_id UUID,
  p_parking_location_id UUID,
  p_parking_slot_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_duration_hours FLOAT,
  p_total_price NUMERIC,
  p_booking_code TEXT,
  p_is_active BOOLEAN,
  p_status TEXT,
  p_amount_to_withdraw NUMERIC,
  p_description TEXT
) RETURNS JSONB AS $$
DECLARE
  v_booking_id UUID;
  v_wallet_balance NUMERIC;
  v_result JSONB;
BEGIN
  -- Start transaction
  BEGIN
    -- Check wallet balance
    SELECT balance INTO v_wallet_balance FROM wallets WHERE id = p_user_id;
    
    IF v_wallet_balance < p_amount_to_withdraw THEN
      RAISE EXCEPTION 'Insufficient funds. Required: %, Available: %', p_amount_to_withdraw, v_wallet_balance;
    END IF;
    
    -- Check if spot is available (this will trigger our conflict check function)
    INSERT INTO bookings (
      user_id,
      parking_location_id,
      parking_slot_id,
      start_time,
      end_time,
      duration_hours,
      total_price,
      booking_code,
      is_active,
      status
    ) VALUES (
      p_user_id,
      p_parking_location_id,
      p_parking_slot_id,
      p_start_time,
      p_end_time,
      p_duration_hours,
      p_total_price,
      p_booking_code,
      p_is_active,
      p_status
    ) RETURNING id INTO v_booking_id;
    
    -- Mark parking slot as occupied
    UPDATE parking_slots
    SET 
      is_occupied = TRUE,
      reserved_until = p_end_time,
      reserved_by = p_user_id
    WHERE id = p_parking_slot_id;
    
    -- Withdraw funds from wallet
    UPDATE wallets
    SET balance = balance - p_amount_to_withdraw
    WHERE id = p_user_id;
    
    -- Record transaction
    INSERT INTO transactions (
      user_id,
      booking_id,
      amount,
      type,
      description
    ) VALUES (
      p_user_id,
      v_booking_id,
      p_amount_to_withdraw,
      'payment',
      p_description
    );
    
    -- Prepare result
    v_result := jsonb_build_object(
      'booking_id', v_booking_id,
      'success', TRUE
    );
    
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- Roll back transaction on any error
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies
-- Enable RLS on the bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own bookings
CREATE POLICY IF NOT EXISTS "Users can view their own bookings"
  ON bookings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to create bookings
CREATE POLICY IF NOT EXISTS "Users can create bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own bookings
CREATE POLICY IF NOT EXISTS "Users can update their own bookings"
  ON bookings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable RLS on the parking_slots table
ALTER TABLE parking_slots ENABLE ROW LEVEL SECURITY;

-- Policy for users to view all parking slots
CREATE POLICY IF NOT EXISTS "Users can view all parking slots"
  ON parking_slots
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for users to update parking slots (only through functions)
CREATE POLICY IF NOT EXISTS "Only functions can update parking slots"
  ON parking_slots
  FOR UPDATE
  USING (auth.uid() IN (SELECT reserved_by FROM parking_slots WHERE id = parking_slots.id) OR 
         current_setting('role') = 'rls_admin');
