
import { supabase } from '@/integrations/supabase/client';
import { BookingParams, BookingResult, CancellationResult } from '@/types/booking';
import { scheduleBookingExpiration } from '@/utils/bookingScheduler';

export async function createBooking(params: BookingParams): Promise<BookingResult> {
  const { 
    parkingLotId, 
    spotId, 
    duration, 
    userId,
    spotLabel,
    price
  } = params;

  try {
    // Start a Supabase transaction by using multiple operations
    // First check if user has enough balance
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', userId)
      .single();
      
    if (walletError) throw walletError;
    
    if (!walletData || walletData.balance < price) {
      return {
        success: false,
        error: new Error(`Insufficient funds. Required: ${price} DZD, Available: ${walletData?.balance || 0} DZD`)
      };
    }

    // Verify spot is still available
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
    
    // Calculate start and end times
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    
    // Generate booking code
    const bookingCode = 'BKG' + Math.floor(100000 + Math.random() * 900000);
    
    // Create a booking record
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        parking_location_id: parkingLotId,
        parking_slot_id: spotId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_hours: duration,
        total_price: price,
        booking_code: bookingCode,
        is_active: true,
        status: 'upcoming'
      })
      .select('id')
      .single();
      
    if (bookingError) {
      throw bookingError;
    }

    // Deduct payment from user's wallet using withdraw_funds function
    const { error: paymentError } = await supabase.rpc('withdraw_funds', {
      amount_to_withdraw: price,
      user_id_input: userId,
      description_input: `Payment for parking spot ${spotLabel} for ${duration} hour(s)`
    });
    
    if (paymentError) {
      // If payment fails, delete the booking we just created
      await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingData.id);
        
      throw paymentError;
    }
    
    // Update the parking slot to mark it as occupied with reservation details
    const { error: slotError } = await supabase
      .from('parking_slots')
      .update({ 
        is_occupied: true,
        reserved_until: endTime.toISOString(),
        reserved_by: userId
      })
      .eq('id', spotId);
      
    if (slotError) {
      // If we fail to update the slot, we should cancel the booking and refund the payment
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
    
    // Schedule the booking to expire automatically
    scheduleBookingExpiration(
      bookingData.id,
      spotId,
      endTime.toISOString()
    );
    
    return {
      success: true,
      bookingId: bookingData.id,
      bookingCode,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };
  } catch (error: any) {
    console.error('Error booking spot:', error);
    return { success: false, error };
  }
}

export async function cancelBooking(bookingId: string, spotId: string): Promise<CancellationResult> {
  try {
    // Get booking details to know if we need to refund
    const { data: booking, error: bookingFetchError } = await supabase
      .from('bookings')
      .select('user_id, total_price, is_active, status')
      .eq('id', bookingId)
      .single();
      
    if (bookingFetchError) {
      throw bookingFetchError;
    }
    
    // Check if booking is already cancelled
    if (booking.status === 'cancelled' || !booking.is_active) {
      return { 
        success: false, 
        error: new Error("Booking is already cancelled") 
      };
    }
    
    // Update the booking to mark it as inactive and cancelled
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({ 
        is_active: false,
        status: 'cancelled'
      })
      .eq('id', bookingId);
      
    if (bookingError) {
      throw bookingError;
    }
    
    // Update the parking slot to mark it as unoccupied
    const { error: slotError } = await supabase
      .from('parking_slots')
      .update({ 
        is_occupied: false,
        reserved_until: null,
        reserved_by: null
      })
      .eq('id', spotId);
      
    if (slotError) {
      throw slotError;
    }
    
    // Refund the booking amount to user's wallet
    const refundAmount = booking.total_price;
    const { error: refundError } = await supabase.rpc('add_funds', {
      amount_to_add: refundAmount,
      user_id_input: booking.user_id,
      description_input: `Refund for cancelled booking #${bookingId}`
    });
    
    if (refundError) {
      console.error('Error processing refund:', refundError);
      // We've already cancelled the booking and freed the spot,
      // so we'll return success but note the refund failed
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
