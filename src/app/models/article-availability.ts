import { Category } from './category';

export interface ArticleAvailability {
  id: number;
  name: string;
  description?: string;
  pricePerDay?: number;
  quantityTotal: number;
  quantityAvailable: number;
  category?: Category;
}