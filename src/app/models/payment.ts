export interface Payment {
  id?: number;
  reservationId: number;
  amount: number;
  paymentDate: Date;
  method: string;
  note?: string;
  createdAt?: Date;
}
