import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for booking creation parameters
 */
export interface BookingParams {
  userId: string;
  parkingLotId: string;
  spotId: string;
  startTime: string;
  endTime: string;
  price: number;
  spotLabel: string;
}

/**
 * Interface for booking creation result
 */
export interface BookingResult {
  success: boolean;
  bookingId?: string;
  bookingCode?: string;
  error?: Error;
}

/**
 * Interface for booking cancellation result
 */
export interface CancellationResult {
  success: boolean;
  refunded?: number;
  error?: Error;
}

/**
 * Creates a new booking and marks the parking slot as occupied
 * 
 * @param params The booking parameters
 * @returns A promise that resolves to a BookingResult
 */
export async function createBooking(params: BookingParams): Promise<BookingResult> {
  const {
    userId,
    parkingLotId,
    spotId,
    startTime,
    endTime,
    price,
    spotLabel
  } = params;

  try {
    // Check if user has enough balance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', userId)
      .single();
      
    if (walletError) throw walletError;
    
    if (!walletData || walletData.balance < price) {
      return {
        success: false,
        error: new Error(`Insufficient funds. Required: ${price}, Available: ${walletData?.balance || 0}`)
      };
    }

    // Verify spot is available
    const { data: spotData, error: spotError } = await supabase
      .from('parking_slots')
      .select('is_occupied')
      .eq('id', spotId)
      .single();
      
    if (spotError) throw spotError;
    
    if (spotData.is_occupied) {
      return {
        success: false,
        error: new Error(`Spot ${spotLabel} is already occupied`)
      };
    }

    // Check for overlapping bookings
    const startTimeISO = new Date(startTime).toISOString();
    const endTimeISO = new Date(endTime).toISOString();
    
    const { data: overlappingBookings, error: bookingCheckError } = await supabase
      .from('bookings')
      .select('id')
      .eq('parking_slot_id', spotId)
      .eq('is_active', true)
      .or(`and(start_time.lte.${endTimeISO},end_time.gte.${startTimeISO})`);
      
    if (bookingCheckError) throw bookingCheckError;
    
    if (overlappingBookings && overlappingBookings.length > 0) {
      return {
        success: false,
        error: new Error(`Spot ${spotLabel} is already booked for the selected time range`)
      };
    }

    // Calculate duration in hours
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    // Generate booking code
    const bookingCode = 'BKG' + Math.floor(100000 + Math.random() * 900000);

    // Create booking record
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        parking_location_id: parkingLotId,
        parking_slot_id: spotId,
        start_time: startTimeISO,
        end_time: endTimeISO,
        duration_hours: durationHours,
        total_price: price,
        booking_code: bookingCode,
        is_active: true,
        status: 'active'
      })
      .select('id')
      .single();
      
    if (bookingError) throw bookingError;

    // Deduct payment from wallet
    const { error: paymentError } = await supabase.rpc('withdraw_funds', {
      amount_to_withdraw: price,
      user_id_input: userId,
      description_input: `Payment for parking spot ${spotLabel} for ${durationHours.toFixed(1)} hour(s)`
    });
    
    if (paymentError) {
      // If payment fails, delete the booking
      await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingData.id);
        
      throw paymentError;
    }

    // Mark parking slot as occupied
    const { error: slotError } = await supabase
      .from('parking_slots')
      .update({
        is_occupied: true,
        reserved_until: endTimeISO,
        reserved_by: userId
      })
      .eq('id', spotId);
      
    if (slotError) {
      // If slot update fails, refund payment and delete booking
      await supabase.rpc('add_funds', {
        amount_to_add: price,
        user_id_input: userId,
        description_input: `Refund for failed booking of spot ${spotLabel}`
      });
      
      await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingData.id);
        
      throw slotError;
    }

    // Schedule booking expiration
    scheduleBookingExpiration(bookingData.id, spotId, endTimeISO);

    return {
      success: true,
      bookingId: bookingData.id,
      bookingCode
    };
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return { success: false, error };
  }
}

/**
 * Cancels a booking, marks the parking slot as available, and refunds the payment
 * 
 * @param bookingId The ID of the booking to cancel
 * @param spotId The ID of the parking slot to free
 * @returns A promise that resolves to a CancellationResult
 */
export async function cancelBooking(bookingId: string, spotId: string): Promise<CancellationResult> {
  try {
    // Get booking details
    const { data: booking, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('user_id, total_price, is_active, status')
      .eq('id', bookingId)
      .single();
      
    if (bookingFetchError) throw bookingFetchError;
    
    // Check if booking is already cancelled
    if (booking.status === 'cancelled' || !booking.is_active) {
      return {
        success: false,
        error: new Error("Booking is already cancelled")
      };
    }

    // Update booking status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        is_active: false,
        status: 'cancelled'
      })
      .eq('id', bookingId);
      
    if (bookingError) throw bookingError;

    // Free the parking slot
    const { error: slotError } = await supabase
      .from('parking_slots')
      .update({
        is_occupied: false,
        reserved_until: null,
        reserved_by: null
      })
      .eq('id', spotId);
      
    if (slotError) throw slotError;

    // Refund payment
    const refundAmount = booking.total_price;
    const { error: refundError } = await supabase.rpc('add_funds', {
      amount_to_add: refundAmount,
      user_id_input: booking.user_id,
      description_input: `Refund for cancelled booking #${bookingId}`
    });
    
    if (refundError) {
      console.error('Error processing refund:', refundError);
      return {
        success: true,
        error: new Error(`Booking cancelled but refund failed: ${refundError.message}`),
        refunded: 0
      };
    }

    return {
      success: true,
      refunded: refundAmount
    };
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return { success: false, error };
  }
}

/**
 * Expires a booking by marking it as completed and freeing the parking slot
 * 
 * @param bookingId The ID of the booking to expire
 * @param spotId The ID of the parking slot to free
 * @returns A promise that resolves to a boolean indicating success or failure
 */
export async function expireBooking(bookingId: string, spotId: string): Promise<boolean> {
  try {
    // Get booking details
    const { data: booking, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('is_active, status')
      .eq('id', bookingId)
      .single();
      
    if (bookingFetchError) {
      console.error('Error fetching booking:', bookingFetchError);
      return false;
    }
    
    // Check if booking is already completed or cancelled
    if (!booking.is_active || booking.status === 'completed' || booking.status === 'cancelled') {
      console.log(`Booking ${bookingId} is already inactive with status: ${booking.status}`);
      return true; // Already in the desired state
    }
    
    // Update booking status
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        is_active: false,
        status: 'completed'
      })
      .eq('id', bookingId);
      
    if (bookingError) {
      console.error('Error marking booking as completed:', bookingError);
      return false;
    }
    
    // Free the parking slot
    const { error: slotError } = await supabase
      .from('parking_slots')
      .update({
        is_occupied: false,
        reserved_until: null,
        reserved_by: null
      })
      .eq('id', spotId);
      
    if (slotError) {
      console.error('Error marking slot as unoccupied:', slotError);
      return false;
    }
    
    console.log(`Successfully expired booking ${bookingId} and freed slot ${spotId}`);
    return true;
  } catch (error) {
    console.error('Error expiring booking:', error);
    return false;
  }
}

/**
 * Checks for and expires all overdue bookings
 * 
 * @returns A promise that resolves to a boolean indicating if any bookings were processed
 */
export async function checkAndExpireOverdueBookings(): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    // Get all active bookings that have ended
    const { data: overdueBookings, error } = await supabase
      .from('bookings')
      .select('id, parking_slot_id')
      .eq('is_active', true)
      .lt('end_time', now);
      
    if (error) throw error;
    
    // Also check for expired parking slots
    const { data: expiredSlots, error: slotsError } = await supabase
      .from('parking_slots')
      .select('id')
      .eq('is_occupied', true)
      .lt('reserved_until', now);
    
    if (slotsError) throw slotsError;
    
    console.log(`Found ${overdueBookings?.length || 0} overdue bookings and ${expiredSlots?.length || 0} expired slots`);
    
    // Process overdue bookings
    if (overdueBookings && overdueBookings.length > 0) {
      const results = await Promise.all(
        overdueBookings.map(booking => 
          expireBooking(booking.id, booking.parking_slot_id)
        )
      );
      
      const successCount = results.filter(result => result).length;
      console.log(`Successfully expired ${successCount} out of ${overdueBookings.length} overdue bookings`);
    }
    
    // Process expired slots that might not have associated bookings
    if (expiredSlots && expiredSlots.length > 0) {
      const slotIds = expiredSlots.map(slot => slot.id);
      
      const { error: updateSlotsError } = await supabase
        .from('parking_slots')
        .update({
          is_occupied: false,
          reserved_until: null,
          reserved_by: null
        })
        .in('id', slotIds);
        
      if (updateSlotsError) {
        console.error('Error freeing expired slots:', updateSlotsError);
      } else {
        console.log(`Successfully freed ${slotIds.length} expired parking slots`);
      }
    }
    
    return (overdueBookings?.length || 0) + (expiredSlots?.length || 0) > 0;
  } catch (error) {
    console.error('Error checking for overdue bookings:', error);
    return false;
  }
}

/**
 * Schedules a booking to expire at the specified time
 * 
 * @param bookingId The ID of the booking to expire
 * @param spotId The ID of the parking slot to free
 * @param endTime The ISO string representing when the booking ends
 */
function scheduleBookingExpiration(bookingId: string, spotId: string, endTime: string): void {
  const endDateTime = new Date(endTime);
  const now = new Date();
  
  // Calculate milliseconds until expiration
  const timeUntilExpiration = endDateTime.getTime() - now.getTime();
  
  // Only schedule if expiration is in the future and less than 24 hours away
  if (timeUntilExpiration > 0 && timeUntilExpiration < 24 * 60 * 60 * 1000) {
    setTimeout(async () => {
      try {
        const success = await expireBooking(bookingId, spotId);
        
        if (success) {
          console.log(`Successfully expired booking ${bookingId} via scheduled task`);
        } else {
          console.log(`Failed to expire booking ${bookingId}, trying general expiration check...`);
          await checkAndExpireOverdueBookings();
        }
      } catch (error) {
        console.error('Error in scheduled booking expiration:', error);
      }
    }, timeUntilExpiration);
    
    console.log(`Booking ${bookingId} scheduled to expire in ${Math.floor(timeUntilExpiration / 60000)} minutes`);
  } else if (timeUntilExpiration > 0) {
    console.log(`Booking ${bookingId} will expire in more than 24 hours. Relying on periodic expiration check.`);
  }
}
