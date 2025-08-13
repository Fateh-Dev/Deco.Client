import { Reservation } from './reservation';

export interface Client {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  eventType?: string;
  address?: string;
  companyName?: string;
  createdAt: Date;
  isActive: boolean;
  
  // Navigation properties
  reservations?: Reservation[];
}
