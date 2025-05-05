
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Clock, QrCode } from 'lucide-react';
import QRCode from '@/components/ui-components/QRCode';
import { useToast } from '@/hooks/use-toast';

// Mock booking data - would normally come from API/Supabase
const bookings = {
  '101': {
    id: '101',
    parkingName: 'Central Parking Algiers',
    spotLabel: 'A12',
    address: 'Rue Didouche Mourad, Algiers',
    startTime: '2025-05-05 14:30',
    endTime: '2025-05-05 16:30',
    duration: 2,
    price: 300,
    status: 'active',
  },
  'BKG123456': {
    id: 'BKG123456',
    parkingName: 'Central Parking Algiers',
    spotLabel: 'A1',
    address: 'Rue Didouche Mourad, Algiers',
    startTime: '2025-05-05 10:00',
    endTime: '2025-05-05 11:00',
    duration: 1,
    price: 150,
    status: 'active',
  }
};

const BookingDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Find booking by ID or use a fallback if we're coming from confirmation page
  const booking = id && (
    bookings[id as keyof typeof bookings] || 
    { 
      id, 
      parkingName: 'Central Parking Algiers',
      spotLabel: 'A1',
      address: 'Rue Didouche Mourad, Algiers',
      startTime: new Date().toLocaleString(),
      endTime: new Date(Date.now() + 3600000).toLocaleString(),
      duration: 1,
      price: 150,
      status: 'active',
    }
  );
  
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
  
  const handleCancelBooking = () => {
    toast({
      title: "Booking Cancelled",
      description: "Your booking has been cancelled and your wallet has been refunded.",
    });
    
    navigate('/bookings');
  };
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-2">Booking Details</h1>
      <p className="text-sm text-muted-foreground mb-6">ID: {booking.id}</p>
      
      <div className="bg-card rounded-lg border p-4 mb-6">
        <h2 className="font-semibold mb-2">{booking.parkingName}</h2>
        <p className="text-sm mb-2">Spot {booking.spotLabel}</p>
        
        <div className="flex items-start mb-4">
          <MapPin size={18} className="mr-2 text-primary mt-0.5" />
          <p className="text-sm">{booking.address}</p>
        </div>
        
        <div className="flex items-center mb-2">
          <Calendar size={16} className="mr-2 text-primary" />
          <p className="text-sm">{booking.startTime.split(' ')[0]}</p>
        </div>
        
        <div className="flex items-center mb-4">
          <Clock size={16} className="mr-2 text-primary" />
          <p className="text-sm">
            {booking.startTime.split(' ')[1]} - {booking.endTime.split(' ')[1]}
            <span className="ml-2 text-muted-foreground">({booking.duration} hour{booking.duration > 1 ? 's' : ''})</span>
          </p>
        </div>
        
        <div className="border-t pt-2 flex justify-between">
          <p className="font-medium">Total</p>
          <p className="font-bold text-primary">{booking.price} DZD</p>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border p-4 mb-6 text-center">
        <h2 className="font-semibold mb-4">QR Code</h2>
        <QRCode value={booking.id} />
        <p className="text-sm text-muted-foreground mt-2">
          Show this QR code at the parking entrance
        </p>
      </div>
      
      {booking.status === 'active' && (
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleCancelBooking}
        >
          Cancel Booking
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
