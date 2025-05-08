
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseSpotVerifierProps {
  onSpotUnavailable: () => void;
  refetchSpots: () => Promise<any>;
}

export function useSpotVerifier({ onSpotUnavailable, refetchSpots }: UseSpotVerifierProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const verifySpotAvailability = async (spotId: string, spotLabel: string): Promise<boolean> => {
    if (!spotId) return false;
    
    setIsVerifying(true);
    try {
      const { data, error } = await supabase
        .from('parking_slots')
        .select('is_occupied, slot_label')
        .eq('id', spotId)
        .single();
        
      if (error) throw error;
      
      if (data.is_occupied) {
        toast({
          title: "Spot Unavailable",
          description: `The spot ${data.slot_label} has just been taken. Please select another spot.`,
          variant: "destructive"
        });
        
        // Refresh spots to show updated status
        await refetchSpots();
        onSpotUnavailable();
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error('Error verifying spot availability:', error);
      toast({
        title: "Verification Error",
        description: "Could not verify spot availability. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    verifySpotAvailability,
    isVerifying
  };
}
