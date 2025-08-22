import { ReservationItem } from './reservation-item';
import { Client } from './client';

export enum ReservationStatus {
  EnAttente = 'EnAttente',
  Confirmee = 'Confirmee',
  Annulee = 'Annulee',
  Terminee = 'Terminee'
}

export interface Reservation {
  id?: number;
  clientId: number;
  startDate: Date;
  endDate: Date;
  status: ReservationStatus;
  totalPrice: number;
  createdAt: Date;
  isActive: boolean;
  remarques?: string;
  
  // Navigation properties
  client?: Client;
  reservationItems: ReservationItem[];
}
