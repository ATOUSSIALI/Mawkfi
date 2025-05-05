
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui-components/Logo';

const WelcomePage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Logo size="lg" />
          <h1 className="mt-4 text-2xl font-bold">Welcome to ParkDZ</h1>
          <p className="mt-2 text-muted-foreground">
            Find and reserve parking spots across Algeria with ease
          </p>
        </div>
        
        <div className="space-y-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="bg-primary/10 p-4 rounded-lg">
            <h2 className="font-medium text-primary mb-2">Simple Parking Solution</h2>
            <p className="text-sm">
              Find, book, and pay for parking spots in major cities across Algeria.
            </p>
          </div>
          
          <div className="bg-primary/10 p-4 rounded-lg">
            <h2 className="font-medium text-primary mb-2">Save Time & Money</h2>
            <p className="text-sm">
              No more driving around looking for parking. Reserve in advance and pay only for what you need.
            </p>
          </div>
          
          <div className="bg-primary/10 p-4 rounded-lg">
            <h2 className="font-medium text-primary mb-2">Easy Access</h2>
            <p className="text-sm">
              Use your QR code to enter and exit parking lots without hassle.
            </p>
          </div>
        </div>
        
        <div className="mt-8 space-y-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <Link to="/login">
            <Button className="w-full btn-primary">Login</Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" className="w-full">Create Account</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
