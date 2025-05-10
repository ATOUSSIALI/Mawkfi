
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
  refunded?: number;
}

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  parkingName: string;
  spotLabel: string;
  address: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: BookingStatus;
  isActive: boolean;
  bookingCode: string;
  parkingSlotId: string;
  parkingLocationId: string;
}
