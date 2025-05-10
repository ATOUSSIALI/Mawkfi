
import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/ui-components/PageContainer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserBookings } from '@/hooks/use-user-bookings';
import BookingCard from '@/components/bookings/BookingCard';
import { Button } from '@/components/ui/button';
import { Car, MapPin } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { bookings, isLoading } = useUserBookings('upcoming');
  
  return (
    <PageContainer className="pb-20">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to ParkEase!</p>
      </header>
      
      <div className="space-y-6">
        {/* Quick Actions Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button 
              variant="outline"
              className="h-auto flex flex-col items-center justify-center py-4 border-dashed"
              onClick={() => navigate('/parking')}
            >
              <Car className="mb-2 h-5 w-5" />
              <span>Find Parking</span>
            </Button>
            <Button 
              variant="outline"
              className="h-auto flex flex-col items-center justify-center py-4 border-dashed"
              onClick={() => navigate('/bookings')}
            >
              <MapPin className="mb-2 h-5 w-5" />
              <span>My Bookings</span>
            </Button>
          </CardContent>
        </Card>
        
        {/* Active Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Active Bookings</CardTitle>
            <CardDescription>Your ongoing and upcoming parking bookings</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <p className="text-center py-4 text-muted-foreground">Loading bookings...</p>
            ) : bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <BookingCard 
                    key={booking.id}
                    booking={booking}
                    onClick={() => navigate(`/booking/${booking.id}`, { state: booking })}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">You have no active bookings</p>
                <Button 
                  onClick={() => navigate('/parking')}
                  variant="outline"
                >
                  Find Parking
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default DashboardPage;
