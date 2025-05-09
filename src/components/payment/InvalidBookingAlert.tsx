
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const InvalidBookingAlert = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-8">
      <AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Invalid Booking</h1>
      <p className="text-muted-foreground mb-6">No parking spot was selected.</p>
      <Button onClick={() => navigate('/parking')}>
        Find Parking
      </Button>
    </div>
  );
};

export default InvalidBookingAlert;
