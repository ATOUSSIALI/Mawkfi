
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, QrCode, Loader2 } from 'lucide-react';
import QRCode from '@/components/ui-components/QRCode';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useParkingBooking } from '@/hooks/use-parking-booking';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingStatus } from '@/types/booking';

// Interface to match the structure of our bookings data
interface BookingData {
  id: string;
  parkingName: string;
  spotLabel: string;
  address: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: BookingStatus;
  parkingSlotId: string;
  bookingCode: string;
}

const BookingDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cancelBooking, isProcessing } = useParkingBooking();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch booking details
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            parking_locations(name, address),
            parking_slots(slot_label)
          `)
          .eq('id', id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setBooking({
            id: data.id,
            parkingName: data.parking_locations?.name || 'Unknown Location',
            spotLabel: data.parking_slots?.slot_label || 'Unknown Spot',
            address: data.parking_locations?.address || 'Unknown Address',
            startTime: data.start_time,
            endTime: data.end_time,
            duration: data.duration_hours,
            price: Number(data.total_price),
            status: (data.status || 'completed') as BookingStatus,
            parkingSlotId: data.parking_slot_id,
            bookingCode: data.booking_code
          });
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        toast({
          title: "Error",
          description: "Could not load booking details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookingDetails();
    
    // Setup subscription for real-time updates
    const channel = supabase
      .channel('booking-details-changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'bookings',
        filter: `id=eq.${id}`
      }, fetchBookingDetails)
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, toast]);
  
  const handleCancelBooking = async () => {
    if (!booking) return;
    
    const result = await cancelBooking(booking.id, booking.parkingSlotId);
    
    if (result.success) {
      if (result.refunded) {
        toast({
          title: "Booking Cancelled",
          description: `Your booking has been cancelled and ${result.refunded} DZD has been refunded to your wallet.`,
        });
      } else {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been cancelled successfully.",
        });
      }
      
      // Update booking locally for instant UI feedback
      setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null);
      
      // Redirect to bookings page after a short delay
      setTimeout(() => {
        navigate('/bookings');
      }, 1500);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <PageContainer className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </PageContainer>
    );
  }
  
  // Render not found state
  if (!booking) {
    return (
      <PageContainer>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Booking not found</p>
          <Button className="mt-4" onClick={() => navigate('/bookings')}>
            Back to Bookings
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  // Format dates for display
  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };
  
  const startDateTime = formatDateTime(booking.startTime);
  const endDateTime = formatDateTime(booking.endTime);
  
  // Status badge styles
  const statusColors = {
    upcoming: 'bg-primary text-white',
    completed: 'bg-muted text-muted-foreground',
    cancelled: 'bg-destructive text-white',
  };
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-2">Booking Details</h1>
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">ID: {booking.bookingCode}</p>
        <div className={`px-3 py-1 rounded text-sm ${statusColors[booking.status]}`}>
          {booking.status === 'upcoming' ? 'Active' : booking.status === 'completed' ? 'Completed' : 'Cancelled'}
        </div>
      </div>
      
      {booking.status === 'cancelled' && (
        <Alert className="mb-6 bg-red-50 border-red-200 text-red-700">
          <AlertDescription>
            This booking has been cancelled and is no longer valid.
          </AlertDescription>
        </Alert>
      )}
      
      {booking.status === 'completed' && (
        <Alert className="mb-6 bg-gray-50 border-gray-200">
          <AlertDescription>
            This booking has been completed.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="bg-card rounded-lg border p-4 mb-6">
        <h2 className="font-semibold mb-2">{booking.parkingName}</h2>
        <p className="text-sm mb-2">Spot {booking.spotLabel}</p>
        
        <div className="flex items-start mb-4">
          <MapPin size={18} className="mr-2 text-primary mt-0.5" />
          <p className="text-sm">{booking.address}</p>
        </div>
        
        <div className="flex items-center mb-2">
          <Calendar size={16} className="mr-2 text-primary" />
          <p className="text-sm">{startDateTime.date}</p>
        </div>
        
        <div className="flex items-center mb-4">
          <Clock size={16} className="mr-2 text-primary" />
          <p className="text-sm">
            {startDateTime.time} - {endDateTime.time}
            <span className="ml-2 text-muted-foreground">({booking.duration} hour{booking.duration > 1 ? 's' : ''})</span>
          </p>
        </div>
        
        <div className="border-t pt-2 flex justify-between">
          <p className="font-medium">Total</p>
          <p className="font-bold text-primary">{booking.price} DZD</p>
        </div>
      </div>
      
      {booking.status === 'upcoming' && (
        <div className="bg-card rounded-lg border p-4 mb-6 text-center">
          <h2 className="font-semibold mb-4">QR Code</h2>
          <QRCode value={booking.bookingCode} />
          <p className="text-sm text-muted-foreground mt-2">
            Show this QR code at the parking entrance
          </p>
        </div>
      )}
      
      {booking.status === 'upcoming' && (
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleCancelBooking}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Cancel Booking'}
        </Button>
      )}
      
      <Button 
        variant="outline" 
        className="w-full mt-3"
        onClick={() => navigate('/bookings')}
      >
        Back to Bookings
      </Button>
    </PageContainer>
  );
};

export default BookingDetailsPage;
