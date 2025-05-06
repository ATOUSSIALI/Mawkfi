
import React, { useState } from 'react';
import PageContainer from '@/components/ui-components/PageContainer';
import ParkingLotCard from '@/components/parking/ParkingLotCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface ParkingLocation {
  id: string;
  name: string;
  address: string;
  hourly_price: number;
  total_spots: number;
  available_spots: number;
  image_url: string | null;
}

const ParkingListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  const { data: parkingLots, isLoading } = useQuery({
    queryKey: ['parkingLocations'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('parking_locations')
          .select('id, name, address, hourly_price, total_spots, available_spots, image_url');
          
        if (error) {
          throw error;
        }
        
        return data.map((location: ParkingLocation) => ({
          id: location.id,
          name: location.name,
          address: location.address,
          price: Number(location.hourly_price),
          availableSpots: location.available_spots,
          totalSpots: location.total_spots,
          imageUrl: location.image_url
        }));
      } catch (error: any) {
        console.error('Error fetching parking locations:', error);
        toast({
          title: "Error loading parking locations",
          description: error.message || "Please try again later.",
          variant: "destructive"
        });
        return [];
      }
    }
  });
  
  const filteredParkingLots = parkingLots?.filter(
    (parking) => 
      parking.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parking.address.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-6">Find Parking</h1>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
        <Input
          placeholder="Search by location or name"
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading parking locations...</p>
          </div>
        ) : filteredParkingLots.length > 0 ? (
          filteredParkingLots.map((parking) => (
            <ParkingLotCard 
              key={parking.id} 
              id={parking.id} 
              name={parking.name} 
              address={parking.address} 
              price={parking.price} 
              availableSpots={parking.availableSpots} 
              totalSpots={parking.totalSpots} 
              imageUrl={parking.imageUrl || undefined}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No parking lots found</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ParkingListPage;
