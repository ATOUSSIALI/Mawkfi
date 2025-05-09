
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
        
        // Mark the booking as completed (no longer active)
        const { error: updateBookingError } = await supabase
          .from('bookings')
          .update({ 
            is_active: false,
            status: 'completed'
          })
          .eq('id', bookingId);
          
        if (updateBookingError) {
          console.error('Error marking booking as completed:', updateBookingError);
          return;
        }
        
        // Mark the parking slot as unoccupied and clear reservation data
        const { error: updateSlotError } = await supabase
          .from('parking_slots')
          .update({ 
            is_occupied: false,
            reserved_until: null,
            reserved_by: null
          })
          .eq('id', spotId);
          
        if (updateSlotError) {
          console.error('Error marking slot as unoccupied:', updateSlotError);
          return;
        }
        
        console.log(`Booking ${bookingId} completed and slot ${spotId} freed`);
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
      .select('id, parking_slot_id, end_time, is_active')
      .eq('is_active', true)
      .lt('end_time', now);
      
    if (error) {
      throw error;
    }
    
    // Also check for expired parking slots based on reserved_until
    const { data: expiredSlots, error: slotsError } = await supabase
      .from('parking_slots')
      .select('id')
      .eq('is_occupied', true)
      .lt('reserved_until', now);
    
    if (slotsError) {
      throw slotsError;
    }
    
    // Process each overdue booking
    if (overdueBookings && overdueBookings.length > 0) {
      console.log(`Found ${overdueBookings.length} overdue bookings to expire`);
      
      for (const booking of overdueBookings) {
        // Make sure booking data exists and has required properties
        if (!booking || !booking.id || !booking.parking_slot_id) {
          console.error('Invalid booking data:', booking);
          continue;
        }
        
        // Mark the booking as inactive and completed
        const { error: updateBookingError } = await supabase
          .from('bookings')
          .update({ 
            is_active: false,
            status: 'completed'
          })
          .eq('id', booking.id);
          
        if (updateBookingError) {
          console.error(`Error marking booking ${booking.id} as completed:`, updateBookingError);
          continue;
        }
        
        // Mark the parking slot as unoccupied
        const { error: updateSlotError } = await supabase
          .from('parking_slots')
          .update({ 
            is_occupied: false,
            reserved_until: null,
            reserved_by: null
          })
          .eq('id', booking.parking_slot_id);
          
        if (updateSlotError) {
          console.error(`Error marking slot ${booking.parking_slot_id} as unoccupied:`, updateSlotError);
          continue;
        }
        
        console.log(`Expired overdue booking ${booking.id} and freed slot ${booking.parking_slot_id}`);
      }
    }
    
    // Process each expired slot that might not have an associated booking
    if (expiredSlots && expiredSlots.length > 0) {
      console.log(`Found ${expiredSlots.length} expired slots without active bookings`);
      
      for (const slot of expiredSlots) {
        // Mark the slot as unoccupied
        const { error: updateSlotError } = await supabase
          .from('parking_slots')
          .update({ 
            is_occupied: false,
            reserved_until: null,
            reserved_by: null
          })
          .eq('id', slot.id);
          
        if (updateSlotError) {
          console.error(`Error marking expired slot ${slot.id} as unoccupied:`, updateSlotError);
          continue;
        }
        
        console.log(`Freed expired slot ${slot.id}`);
      }
    }
  } catch (error) {
    console.error('Error checking for overdue bookings:', error);
  }
};
