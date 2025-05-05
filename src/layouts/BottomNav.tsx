
import React from 'react';
import { Home, MapPin, User, History } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const location = useLocation();
  
  const navItems = [
    {
      label: 'Home',
      icon: Home,
      href: '/dashboard',
    },
    {
      label: 'Find',
      icon: MapPin,
      href: '/parking',
    },
    {
      label: 'Bookings',
      icon: History,
      href: '/bookings',
    },
    {
      label: 'Profile',
      icon: User,
      href: '/profile',
    },
  ];
  
  return (
    <nav className="bg-card border-t fixed bottom-0 w-full">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full py-1",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon size={20} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
