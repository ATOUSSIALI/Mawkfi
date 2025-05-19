// Follow this setup guide to integrate the Deno runtime into your Supabase project:
// https://supabase.com/docs/guides/functions/deno-runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// This function is meant to be deployed as a Supabase Edge Function
// and scheduled to run periodically (e.g., every 5 minutes)
// to automatically expire overdue bookings

Deno.serve(async (req) => {
  try {
    // Create a Supabase client with the project URL and service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current time
    const now = new Date().toISOString()
    
    // Get all active bookings that have ended
    const { data: overdueBookings, error } = await supabase
      .from('bookings')
      .select('id, parking_slot_id')
      .eq('is_active', true)
      .lt('end_time', now)
    
    if (error) throw error
    
    // Also check for expired parking slots
    const { data: expiredSlots, error: slotsError } = await supabase
      .from('parking_slots')
      .select('id')
      .eq('is_occupied', true)
      .lt('reserved_until', now)
    
    if (slotsError) throw slotsError
    
    console.log(`Found ${overdueBookings?.length || 0} overdue bookings and ${expiredSlots?.length || 0} expired slots`)
    
    // Process overdue bookings
    if (overdueBookings && overdueBookings.length > 0) {
      // Update all bookings to inactive and completed in one operation
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
      
      // Update all associated parking slots in one operation
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
    }
    
    // Process expired slots that might not have associated bookings
    if (expiredSlots && expiredSlots.length > 0) {
      const slotIds = expiredSlots.map(slot => slot.id)
      
      const { error: updateSlotsError } = await supabase
        .from('parking_slots')
        .update({
          is_occupied: false,
          reserved_until: null,
          reserved_by: null
        })
        .in('id', slotIds)
      
      if (updateSlotsError) {
        console.error('Error freeing expired slots:', updateSlotsError)
      } else {
        console.log(`Successfully freed ${slotIds.length} expired parking slots`)
      }
    }
    
    // Return the results
    return new Response(
      JSON.stringify({
        success: true,
        processed: {
          bookings: overdueBookings?.length || 0,
          slots: expiredSlots?.length || 0
        }
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in expire-bookings function:', error)
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
