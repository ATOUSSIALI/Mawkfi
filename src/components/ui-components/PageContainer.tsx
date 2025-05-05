
import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

const PageContainer = ({ children, className }: PageContainerProps) => {
  return (
    <div className={cn("flex-1 w-full max-w-md mx-auto px-4 py-6", className)}>
      {children}
    </div>
  );
};

export default PageContainer;
