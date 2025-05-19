
import { supabase } from '@/integrations/supabase/client';
import { expireBooking } from '@/services/booking-service';

// Function to schedule the expiration of a booking
export const scheduleBookingExpiration = async (bookingId: string, spotId: string, endTime: string) => {
  const endDateTime = new Date(endTime);
  const now = new Date();

  // Calculate milliseconds until the booking expires
  const timeUntilExpiration = endDateTime.getTime() - now.getTime();

  // Only schedule if the expiration is in the future and less than 24 hours away
  // For longer bookings, we'll rely on the periodic checkAndExpireOverdueBookings function
  if (timeUntilExpiration > 0 && timeUntilExpiration < 24 * 60 * 60 * 1000) {
    // Schedule the expiration
    setTimeout(async () => {
      try {
        // First try to expire this specific booking directly
        const success = await expireBooking(bookingId, spotId);

        if (success) {
          console.log(`Successfully expired booking ${bookingId} via scheduled task`);
        } else {
          // If direct expiration failed, try the general expiration check as a fallback
          console.log(`Direct expiration of booking ${bookingId} failed, trying general expiration check...`);
          await checkAndExpireOverdueBookings();

          // Verify if the booking was processed by the general check
          const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('is_active, status')
            .eq('id', bookingId)
            .single();

          if (bookingError) {
            console.error('Error checking booking status:', bookingError);
            return;
          }

          if (booking && booking.is_active) {
            console.error(`Failed to expire booking ${bookingId} after multiple attempts`);
          } else {
            console.log(`Booking ${bookingId} was successfully expired by general check`);
          }
        }
      } catch (error) {
        console.error('Error processing booking expiration:', error);
      }
    }, timeUntilExpiration);

    console.log(`Booking ${bookingId} scheduled to expire in ${Math.floor(timeUntilExpiration / 60000)} minutes`);
  } else if (timeUntilExpiration > 0) {
    // For bookings more than 24 hours in the future, just log that we're relying on the periodic check
    console.log(`Booking ${bookingId} will expire in more than 24 hours (${Math.floor(timeUntilExpiration / (60000 * 60))} hours). Relying on periodic expiration check.`);
  }
};

// Function to check for and expire overdue bookings
export const checkAndExpireOverdueBookings = async () => {
  console.log('Checking for overdue bookings...');
  try {
    const now = new Date().toISOString();

    // Get all active bookings that have ended
    const { data: overdueBookings, error } = await supabase
      .from('bookings')
      .select('id, parking_slot_id, end_time, is_active, status')
      .eq('is_active', true)
      .lt('end_time', now);

    console.log(`Found ${overdueBookings?.length || 0} overdue bookings to process`);

    if (error) {
      throw error;
    }

    // Also check for expired parking slots based on reserved_until
    const { data: expiredSlots, error: slotsError } = await supabase
      .from('parking_slots')
      .select('id, reserved_until')
      .eq('is_occupied', true)
      .lt('reserved_until', now);

    if (slotsError) {
      throw slotsError;
    }

    // Log the number of bookings and slots to expire
    console.log(`Found ${overdueBookings?.length || 0} overdue bookings and ${expiredSlots?.length || 0} expired slots to process`);

    // Process each overdue booking
    if (overdueBookings && overdueBookings.length > 0) {
      console.log(`Processing ${overdueBookings.length} overdue bookings...`);

      // Process each booking individually using the expireBooking function
      // This is more reliable than batch updates as it handles each booking's specific state
      const results = await Promise.all(
        overdueBookings.map(booking =>
          expireBooking(booking.id, booking.parking_slot_id)
        )
      );

      const successCount = results.filter(result => result).length;
      console.log(`Successfully expired ${successCount} out of ${overdueBookings.length} overdue bookings`);
    }

    // Process each expired slot that might not have an associated booking
    if (expiredSlots && expiredSlots.length > 0) {
      // Get all slot IDs in one array
      const slotIds = expiredSlots.map(slot => slot.id);

      // Update all expired slots in one operation
      const { error: updateSlotsError } = await supabase
        .from('parking_slots')
        .update({
          is_occupied: false,
          reserved_until: null,
          reserved_by: null
        })
        .in('id', slotIds);

      if (updateSlotsError) {
        console.error(`Error marking expired slots as unoccupied:`, updateSlotsError);
      } else {
        console.log(`Successfully freed ${slotIds.length} expired parking slots`);
      }
    }

    // Return true if any bookings or slots were processed
    return (overdueBookings?.length || 0) + (expiredSlots?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking for overdue bookings:', error);
  }
};
