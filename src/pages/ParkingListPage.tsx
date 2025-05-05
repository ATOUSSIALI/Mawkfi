
import React, { useState } from 'react';
import PageContainer from '@/components/ui-components/PageContainer';
import ParkingLotCard from '@/components/parking/ParkingLotCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const ParkingListPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data - normally from API/Supabase
  const parkingLots = [
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
    {
      id: '3',
      name: 'Bab El Oued Plaza',
      address: 'Bab El Oued, Algiers',
      price: 100,
      availableSpots: 8,
      totalSpots: 15,
    },
    {
      id: '4',
      name: 'Casbah Parking',
      address: 'Casbah District, Algiers',
      price: 180,
      availableSpots: 3,
      totalSpots: 10,
    },
    {
      id: '5',
      name: 'Hydra Center',
      address: 'Hydra, Algiers',
      price: 200,
      availableSpots: 20,
      totalSpots: 25,
    },
  ];
  
  const filteredParkingLots = parkingLots.filter(
    (parking) => 
      parking.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      parking.address.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
        {filteredParkingLots.length > 0 ? (
          filteredParkingLots.map((parking) => (
            <ParkingLotCard key={parking.id} {...parking} />
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
