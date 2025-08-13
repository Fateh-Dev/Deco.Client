import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { Client } from '../models/client';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = 'api/Client'; // Using the ClientController endpoint

  constructor(private http: HttpClient) {}

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.apiUrl).pipe(
      catchError(this.handleError<Client[]>('getClients', []))
    );
  }

  getClient(id: number): Observable<Client> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Client>(url).pipe(
      catchError(this.handleError<Client>(`getClient id=${id}`))
    );
  }

  addClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.apiUrl, client).pipe(
      catchError(this.handleError<Client>('addClient'))
    );
  }

  updateClient(client: Client): Observable<Client> {
    const url = `${this.apiUrl}/${client.id}`;
    return this.http.put<Client>(url, client).pipe(
      catchError(this.handleError<Client>('updateClient'))
    );
  }

  deleteClient(id: number): Observable<unknown> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete(url).pipe(
      catchError(this.handleError('deleteClient'))
    );
  }

  searchClients(term: string): Observable<Client[]> {
    if (!term.trim()) {
      return this.getClients();
    }
    return this.http.get<Client[]>(`${this.apiUrl}?name=${term}`).pipe(
      map(clients => clients || []),
      catchError(this.handleError<Client[]>('searchClients', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
