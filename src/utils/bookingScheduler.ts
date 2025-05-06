
import { supabase } from '@/integrations/supabase/client';

// Function to schedule the expiration of a booking
export const scheduleBookingExpiration = async (bookingId: string, spotId: string, endTime: string) => {
  const endDateTime = new Date(endTime);
  const now = new Date();
  
  // Calculate milliseconds until the booking expires
  const timeUntilExpiration = endDateTime.getTime() - now.getTime();
  
  // Only schedule if the expiration is in the future
  if (timeUntilExpiration > 0) {
    // Schedule the expiration
    setTimeout(async () => {
      try {
        // Check if the booking is still active
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('is_active')
          .eq('id', bookingId)
          .single();
          
        if (bookingError || !booking || !booking.is_active) {
          // Booking is already inactive or doesn't exist
          return;
        }
        
        // Mark the booking as inactive
        const { error: updateBookingError } = await supabase
          .from('bookings')
          .update({ is_active: false })
          .eq('id', bookingId);
          
        if (updateBookingError) {
          console.error('Error marking booking as inactive:', updateBookingError);
          return;
        }
        
        // Mark the parking slot as unoccupied
        const { error: updateSlotError } = await supabase
          .from('parking_slots')
          .update({ is_occupied: false })
          .eq('id', spotId);
          
        if (updateSlotError) {
          console.error('Error marking slot as unoccupied:', updateSlotError);
          return;
        }
        
        console.log(`Booking ${bookingId} expired and slot ${spotId} freed`);
      } catch (error) {
        console.error('Error processing booking expiration:', error);
      }
    }, timeUntilExpiration);
    
    console.log(`Booking ${bookingId} scheduled to expire in ${Math.floor(timeUntilExpiration / 60000)} minutes`);
  }
};

// Function to check for and expire overdue bookings
export const checkAndExpireOverdueBookings = async () => {
  try {
    const now = new Date().toISOString();
    
    // Get all active bookings that have ended
    const { data: overdueBookings, error } = await supabase
      .from('bookings')
      .select('id, parking_slot_id, end_time')
      .eq('is_active', true)
      .lt('end_time', now);
      
    if (error) {
      throw error;
    }
    
    if (!overdueBookings || overdueBookings.length === 0) {
      return;
    }
    
    console.log(`Found ${overdueBookings.length} overdue bookings to expire`);
    
    // Process each overdue booking
    for (const booking of overdueBookings) {
      // Mark the booking as inactive
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({ is_active: false })
        .eq('id', booking.id);
        
      if (updateBookingError) {
        console.error(`Error marking booking ${booking.id} as inactive:`, updateBookingError);
        continue;
      }
      
      // Mark the parking slot as unoccupied
      const { error: updateSlotError } = await supabase
        .from('parking_slots')
        .update({ is_occupied: false })
        .eq('id', booking.parking_slot_id);
        
      if (updateSlotError) {
        console.error(`Error marking slot ${booking.parking_slot_id} as unoccupied:`, updateSlotError);
        continue;
      }
      
      console.log(`Expired overdue booking ${booking.id} and freed slot ${booking.parking_slot_id}`);
    }
  } catch (error) {
    console.error('Error checking for overdue bookings:', error);
  }
};
