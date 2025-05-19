// Follow this setup guide to integrate the Deno runtime into your Supabase project:
// https://supabase.com/docs/guides/functions/deno-runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = new Date().toISOString()
    
    // Get all active bookings that have ended
    const { data: overdueBookings, error } = await supabase
      .from('bookings')
      .select('id, parking_slot_id')
      .eq('is_active', true)
      .lt('end_time', now)
    
    if (error) throw error
    
    if (overdueBookings && overdueBookings.length > 0) {
      console.log(`Found ${overdueBookings.length} overdue bookings to process`)
      
      // Update all bookings to inactive and completed
      const bookingIds = overdueBookings.map(booking => booking.id)
      const slotIds = overdueBookings.map(booking => booking.parking_slot_id)
      
      const { error: updateBookingsError } = await supabase
        .from('bookings')
        .update({
          is_active: false,
          status: 'completed'
        })
        .in('id', bookingIds)
      
      if (updateBookingsError) {
        console.error('Error marking bookings as completed:', updateBookingsError)
      } else {
        console.log(`Successfully marked ${bookingIds.length} bookings as completed`)
      }
      
      // Free up the parking slots
      if (slotIds.length > 0) {
        const { error: updateSlotsError } = await supabase
          .from('parking_slots')
          .update({
            is_occupied: false,
            reserved_until: null,
            reserved_by: null
          })
          .in('id', slotIds)
        
        if (updateSlotsError) {
          console.error('Error marking slots as unoccupied:', updateSlotsError)
        } else {
          console.log(`Successfully freed ${slotIds.length} parking slots`)
        }
      }
    } else {
      console.log('No overdue bookings found')
    }
    
    // Also clean up expired locks
    const { error: deleteLocksError, count: deletedLocksCount } = await supabase
      .from('booking_locks')
      .delete({ count: 'exact' })
      .lt('locked_until', now)
    
    if (deleteLocksError) {
      console.error('Error cleaning up expired locks:', deleteLocksError)
    } else if (deletedLocksCount > 0) {
      console.log(`Cleaned up ${deletedLocksCount} expired booking locks`)
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: {
          bookings: overdueBookings?.length || 0,
          locks_cleaned: deletedLocksCount || 0
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in cleanup-bookings function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/* To schedule this function in Supabase:
 * 1. Deploy this function to your Supabase project
 * 2. Go to the Supabase dashboard > Functions
 * 3. Click on the function name
 * 4. Go to the "Schedules" tab
 * 5. Create a new schedule with a cron expression like "*/5 * * * *" (every 5 minutes)
 */
