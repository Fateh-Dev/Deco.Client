import { Article } from './article';

export interface ReservationItem {
  id?: number;
  reservationId: number;
  articleId: number;
  quantity: number;
  unitPrice: number;
  createdAt?: Date;
  article?: Article;
}
