import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { Client } from '../models/client';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = 'http://localhost:5199';
  private apiUrl = `${this.baseUrl}/api/Client`; 

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
      console.error(`${operation} failed:`, error);
      
      let errorMessage = 'Une erreur est survenue';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Erreur: ${error.error.message}`;
      } else if (error.status) {
        // Server-side error
        if (error.status === 400) {
          errorMessage = 'Données invalides. Veuillez vérifier les informations saisies.';
        } else if (error.status === 404) {
          errorMessage = 'Ressource non trouvée';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else {
          errorMessage = `Erreur ${error.status}: ${error.statusText}`;
        }
      }
      
      // You could log to a remote logging service here
      
      // Return an observable with a user-facing error message
      return throwError(() => new Error(errorMessage));
    };
  }
}
