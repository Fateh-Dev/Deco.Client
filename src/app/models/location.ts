export interface Location {
  id?: number;
  name: string;
  description?: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
  email?: string;
  website?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}
