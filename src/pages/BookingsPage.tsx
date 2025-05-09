
import React, { useState } from 'react';
import PageContainer from '@/components/ui-components/PageContainer';
import BookingCard from '@/components/bookings/BookingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserBookings, BookingStatus } from '@/hooks/use-user-bookings';
import { Loader2 } from 'lucide-react';
import { checkAndExpireOverdueBookings } from '@/utils/bookingScheduler';
import { useEffect } from 'react';

const BookingsPage = () => {
  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');
  
  // Check for expired bookings on page load
  useEffect(() => {
    checkAndExpireOverdueBookings();
  }, []);
  
  // Use our custom hook to fetch bookings based on status
  const {
    bookings,
    isLoading,
    refetch
  } = useUserBookings(activeTab);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as BookingStatus);
  };
  
  return (
    <PageContainer className="pb-20">
      <h1 className="text-2xl font-bold mb-6">Your Bookings</h1>
      
      <Tabs defaultValue="upcoming" onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <TabsContent value="upcoming" className="space-y-4">
              {bookings.length > 0 ? (
                bookings.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onStatusChange={refetch}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No upcoming bookings</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              {bookings.length > 0 ? (
                bookings.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking}
                    onStatusChange={refetch}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No completed bookings</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="cancelled" className="space-y-4">
              {bookings.length > 0 ? (
                bookings.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking}
                    onStatusChange={refetch}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No cancelled bookings</p>
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </PageContainer>
  );
};

export default BookingsPage;
