
import React from 'react';
import PageContainer from '@/components/ui-components/PageContainer';
import ParkingLotCard from '@/components/parking/ParkingLotCard';
import WalletCard from '@/components/payment/WalletCard';
import { useToast } from '@/hooks/use-toast';
import { BookingDetails } from '@/components/bookings/BookingCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const DashboardPage = () => {
  const { toast } = useToast();
  
  // Mock data - normally from API/Supabase
  const walletBalance = 2500;
  const nearbyParking = [
    {
      id: '1',
      name: 'Central Parking Algiers',
      address: 'Rue Didouche Mourad, Algiers',
      price: 150,
      availableSpots: 12,
      totalSpots: 20,
    },
    {
      id: '2',
      name: 'Medina Parking',
      address: 'Boulevard Front de Mer, Algiers',
      price: 120,
      availableSpots: 5,
      totalSpots: 30,
    },
  ];
  
  const activeBooking: BookingDetails | null = {
    id: '101',
    parkingName: 'Central Parking Algiers',
    spotLabel: 'A12',
    address: 'Rue Didouche Mourad, Algiers',
    startTime: '2025-05-05 14:30',
    endTime: '2025-05-05 16:30',
    duration: 2,
    price: 300,
    status: 'active',
  };
  
  const handleAddFunds = () => {
    toast({
      title: "Add Funds",
      description: "This feature would normally open a dialog to add funds to your wallet.",
    });
  };
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-6">Welcome back!</h1>
      
      <WalletCard balance={walletBalance} onAddFunds={handleAddFunds} />
      
      {activeBooking ? (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Active Booking</h2>
            <Link to={`/booking/${activeBooking.id}`}>
              <Button variant="link" className="text-primary p-0">View Details</Button>
            </Link>
          </div>
          
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h3 className="font-medium">{activeBooking.parkingName}</h3>
            <p className="text-sm text-muted-foreground">Spot {activeBooking.spotLabel}</p>
            
            <div className="flex justify-between mt-2">
              <div>
                <p className="text-xs text-muted-foreground">Time Remaining</p>
                <p className="font-medium">1h 15m</p>
              </div>
              <Link to={`/booking/${activeBooking.id}`}>
                <Button size="sm">View QR</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Nearby Parking</h2>
          <Link to="/parking">
            <Button variant="link" className="text-primary p-0">View All</Button>
          </Link>
        </div>
        
        <div className="space-y-4">
          {nearbyParking.map((parking) => (
            <ParkingLotCard key={parking.id} {...parking} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
