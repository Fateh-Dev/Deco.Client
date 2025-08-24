import { Category } from './category';

export interface Article {
  id?: number;
  name: string;
  categoryId: number;
  description?: string;
  quantityTotal: number;
  quantityAvailable?: number;
  pricePerDay?: number;
  imageUrl?: string;
  createdAt: Date;
  isActive?: boolean;
  category?: Category;
}
