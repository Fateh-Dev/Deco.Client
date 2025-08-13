import { Article } from './article';
import { Reservation } from './reservation';

export interface ReservationItem {
  id?: number;
  reservationId: number;
  articleId: number;
  quantity: number;
  unitPrice: number;
  durationDays?: number; // Added to match the create-reservation component
  createdAt: Date;
  
  // Navigation properties
  reservation?: Reservation;
  article?: Article;
}
