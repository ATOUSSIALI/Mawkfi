
import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, MapPin, Calendar } from 'lucide-react';
import QRCode from '@/components/ui-components/QRCode';

const BookingConfirmationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const bookingDetails = location.state;
  
  useEffect(() => {
    // If user navigates directly to this page without booking details, redirect to dashboard
    if (!bookingDetails) {
      navigate('/dashboard');
    }
  }, [bookingDetails, navigate]);
  
  if (!bookingDetails) {
    return null;
  }
  
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + (bookingDetails.duration * 60 * 60 * 1000));
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  return (
    <PageContainer className="pb-20">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
          <CheckCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold">Booking Confirmed!</h1>
        <p className="text-muted-foreground">Your parking spot has been reserved</p>
      </div>
      
      <div className="bg-card rounded-lg border p-4 mb-6">
        <h2 className="font-semibold mb-4">Booking Information</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-1">Booking ID</p>
            <p className="font-medium">{bookingDetails.bookingId}</p>
          </div>
          
          <div>
            <p className="text-muted-foreground mb-1">Parking</p>
            <p className="font-medium">{bookingDetails.parkingLotName}</p>
          </div>
          
          <div className="flex items-start">
            <MapPin size={18} className="mr-2 text-primary mt-0.5" />
            <p className="text-sm">Rue Didouche Mourad, Algiers</p>
          </div>
          
          <div className="flex space-x-6">
            <div>
              <p className="text-muted-foreground mb-1">Spot</p>
              <p className="font-medium">{bookingDetails.spotLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Duration</p>
              <p className="font-medium">{bookingDetails.duration} hour{bookingDetails.duration > 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Amount</p>
              <p className="font-medium text-primary">{bookingDetails.price} DZD</p>
            </div>
          </div>
          
          <div className="flex space-x-6">
            <div>
              <div className="flex items-center mb-1">
                <Calendar size={14} className="mr-1" />
                <p className="text-muted-foreground text-sm">{formatDate(startTime)}</p>
              </div>
              <div className="flex items-center space-x-2">
                <p className="font-medium">{formatTime(startTime)}</p>
                <span className="text-muted-foreground">-</span>
                <p className="font-medium">{formatTime(endTime)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-lg border p-4 mb-6 text-center">
        <h2 className="font-semibold mb-4">Scan for Entry</h2>
        <QRCode value={bookingDetails.bookingId} />
        <p className="text-sm text-muted-foreground mt-2">
          Show this QR code at the parking entrance
        </p>
      </div>
      
      <div className="space-y-3">
        <Link to={`/booking/${bookingDetails.bookingId}`}>
          <Button className="w-full">View Booking</Button>
        </Link>
        
        <Link to="/dashboard">
          <Button variant="outline" className="w-full">Back to Home</Button>
        </Link>
      </div>
    </PageContainer>
  );
};

export default BookingConfirmationPage;
