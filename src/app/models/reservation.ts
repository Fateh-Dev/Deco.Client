import { User } from './user';
import { ReservationItem } from './reservation-item';
import { Payment } from './payment';

export enum ReservationStatus {
  EnAttente = 'EnAttente',
  Confirmee = 'Confirmee',
  Annulee = 'Annulee',
  Terminee = 'Terminee'
}

export interface Reservation {
  id?: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  status: ReservationStatus;
  totalPrice: number;
  createdAt?: Date;
  isActive?: boolean;
  user?: User;
  reservationItems?: ReservationItem[];
  payments?: Payment[];
}
