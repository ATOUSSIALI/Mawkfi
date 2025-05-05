
import React from 'react';
import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';
import BottomNav from './BottomNav';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <NavBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default MainLayout;
