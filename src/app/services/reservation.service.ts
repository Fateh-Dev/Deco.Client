import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Reservation } from "../models/reservation";
import { ArticleAvailability } from "../models/article-availability";
import { ConfigService } from "../core/services/config.service";

export interface CreateReservationRequest {
  clientId: number;
  startDate: string;
  endDate: string;
  remarques?: string;
  reservationItems: {
    articleId: number;
    quantity: number;
  }[];
}
@Injectable({
  providedIn: "root"
})
export class ReservationService {
  constructor(
    private http: HttpClient,
    private configService: ConfigService
  ) {}

  private get apiUrl(): string {
    return `${this.configService.apiUrl}/reservations`;
  }

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

  updateReservation(id: number, reservationRequest: CreateReservationRequest): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}`, reservationRequest);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCalendarData(year: number, month: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/calendar/${year}/${month}`);
  }

  getArticlesAvailability(startDate: Date, endDate: Date): Observable<ArticleAvailability[]> {
    const formattedStartDate = startDate.toISOString();
    const formattedEndDate = endDate.toISOString();
    return this.http.get<ArticleAvailability[]>(
      `${this.apiUrl}/articles/availability?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
    );
  }
}
