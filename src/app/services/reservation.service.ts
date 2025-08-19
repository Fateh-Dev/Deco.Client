import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Reservation } from "../models/reservation";

export interface CreateReservationRequest {
  clientId: number;
  startDate: string;
  endDate: string;
  reservationItems: {
    articleId: number;
    quantity: number;
  }[];
}
@Injectable({
  providedIn: "root"
})
export class ReservationService {
  private apiUrl = "http://localhost:5000/api/reservations";

  constructor(private http: HttpClient) {}

  getReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(this.apiUrl);
  }

  getReservation(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/${id}`);
  }

  getReservationsByClient(clientId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/client/${clientId}`);
  }

  // Updated method to accept CreateReservationRequest instead of Reservation
  createReservation(reservationRequest: CreateReservationRequest): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reservationRequest);
  }

  updateReservation(id: number, reservation: Reservation): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, reservation);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCalendarData(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/calendar/${year}/${month}`);
  }
}
