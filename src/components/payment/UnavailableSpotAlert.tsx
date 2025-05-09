
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const UnavailableSpotAlert = () => {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Spot Unavailable</AlertTitle>
      <AlertDescription>
        This parking spot is no longer available. Please go back and select another spot.
      </AlertDescription>
    </Alert>
  );
};

export default UnavailableSpotAlert;
