export interface User {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  eventType?: string;
  createdAt?: Date;
  isActive?: boolean;
}
