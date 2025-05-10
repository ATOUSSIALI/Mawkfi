
export interface BookingParams {
  parkingLotId: string;
  parkingLotName: string;
  spotId: string;
  spotLabel: string;
  duration: number;
  price: number;
  userId: string;
}

export interface BookingResult {
  success: boolean;
  bookingId?: string;
  bookingCode?: string;
  startTime?: string;
  endTime?: string;
  error?: Error;
}

export interface CancellationResult {
  success: boolean;
  error?: Error;
}
