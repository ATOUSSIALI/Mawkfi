
import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/ui-components/PageContainer';
import ParkingLotCard from '@/components/parking/ParkingLotCard';
import WalletCard from '@/components/payment/WalletCard';
import { useToast } from '@/hooks/use-toast';
import { BookingDetails } from '@/components/bookings/BookingCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const DashboardPage = () => {
  const { toast } = useToast();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [nearbyParking, setNearbyParking] = useState<any[]>([]);
  const [activeBooking, setActiveBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No authenticated user found');
          return;
        }
        
        // Fetch wallet balance
        const { data: walletData, error: walletError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('id', user.id)
          .single();
          
        if (walletError) {
          console.error('Error fetching wallet:', walletError);
        } else if (walletData) {
          setWalletBalance(Number(walletData.balance));
        }
        
        // Fetch nearby parking
        const { data: parkingData, error: parkingError } = await supabase
          .from('parking_locations')
          .select('id, name, address, hourly_price, total_spots, image_url')
          .limit(2);
          
        if (parkingError) {
          console.error('Error fetching parking:', parkingError);
        } else if (parkingData) {
          // Get available spots count for each parking location
          const enhancedParkingData = await Promise.all(
            parkingData.map(async (parking) => {
              const { count, error: spotsError } = await supabase
                .from('parking_slots')
                .select('*', { count: 'exact', head: true })
                .eq('parking_location_id', parking.id)
                .eq('is_occupied', false);
                
              return {
                ...parking,
                price: Number(parking.hourly_price),
                availableSpots: count || 0,
                totalSpots: parking.total_spots,
                imageUrl: parking.image_url
              };
            })
          );
          
          setNearbyParking(enhancedParkingData);
        }
        
        // Fetch active booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select(`
            id,
            parking_location_id,
            parking_slot_id,
            start_time,
            end_time,
            duration_hours,
            total_price,
            booking_code,
            parking_slots(slot_label),
            parking_locations(name, address)
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('start_time', { ascending: false })
          .limit(1)
          .single();
          
        if (bookingError && bookingError.code !== 'PGRST116') {
          console.error('Error fetching booking:', bookingError);
        } else if (bookingData) {
          setActiveBooking({
            id: bookingData.id,
            parkingName: bookingData.parking_locations.name,
            spotLabel: bookingData.parking_slots.slot_label,
            address: bookingData.parking_locations.address,
            startTime: bookingData.start_time,
            endTime: bookingData.end_time,
            duration: bookingData.duration_hours,
            price: Number(bookingData.total_price),
            status: 'active',
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
          {isLoading ? (
            <p className="text-center py-4 text-muted-foreground">Loading...</p>
          ) : nearbyParking.length > 0 ? (
            nearbyParking.map((parking) => (
              <ParkingLotCard 
                key={parking.id} 
                {...parking} 
              />
            ))
          ) : (
            <p className="text-center py-4 text-muted-foreground">No parking locations found</p>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
