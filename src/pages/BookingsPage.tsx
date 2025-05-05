
import React, { useState } from 'react';
import PageContainer from '@/components/ui-components/PageContainer';
import BookingCard, { BookingDetails } from '@/components/bookings/BookingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BookingsPage = () => {
  const [activeTab, setActiveTab] = useState('active');
  
  // Mock data - would normally come from API/Supabase
  const bookings: BookingDetails[] = [
    {
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
    {
      id: '102',
      parkingName: 'Medina Parking',
      spotLabel: 'B5',
      address: 'Boulevard Front de Mer, Algiers',
      startTime: '2025-05-03 10:00',
      endTime: '2025-05-03 12:00',
      duration: 2,
      price: 240,
      status: 'completed',
    },
    {
      id: '103',
      parkingName: 'Hydra Center',
      spotLabel: 'C8',
      address: 'Hydra, Algiers',
      startTime: '2025-05-01 09:00',
      endTime: '2025-05-01 11:00',
      duration: 2,
      price: 400,
      status: 'completed',
    },
    {
      id: '104',
      parkingName: 'Bab El Oued Plaza',
      spotLabel: 'A3',
      address: 'Bab El Oued, Algiers',
      startTime: '2025-04-28 16:00',
      endTime: '2025-04-28 17:00',
      duration: 1,
      price: 100,
      status: 'completed',
    },
    {
      id: '105',
      parkingName: 'Casbah Parking',
      spotLabel: 'D2',
      address: 'Casbah District, Algiers',
      startTime: '2025-04-25 12:30',
      endTime: '2025-04-25 15:30',
      duration: 3,
      price: 540,
      status: 'cancelled',
    },
  ];
  
  const activeBookings = bookings.filter(booking => booking.status === 'active');
  const completedBookings = bookings.filter(booking => booking.status === 'completed');
  const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled');
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-6">Your Bookings</h1>
      
      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {activeBookings.length > 0 ? (
            activeBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active bookings</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {completedBookings.length > 0 ? (
            completedBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No completed bookings</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="cancelled" className="space-y-4">
          {cancelledBookings.length > 0 ? (
            cancelledBookings.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No cancelled bookings</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default BookingsPage;
