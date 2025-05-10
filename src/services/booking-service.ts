
import { supabase } from '@/integrations/supabase/client';
import { BookingParams, BookingResult, CancellationResult } from '@/types/booking';
import { scheduleBookingExpiration } from '@/utils/bookingScheduler';

export async function createBooking(params: BookingParams): Promise<BookingResult> {
  const { 
    parkingLotId, 
    spotId, 
    duration, 
    userId,
    spotLabel
  } = params;

  try {
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
        total_price: params.price,
        booking_code: bookingCode,
        is_active: true,
        status: 'upcoming'
      })
      .select('id')
      .single();
      
    if (bookingError) {
      throw bookingError;
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
      // If we fail to update the slot, we should cancel the booking
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
    
    // Could add code here to refund the user if cancellation policy allows
    
    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return { success: false, error };
  }
}
