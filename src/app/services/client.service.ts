import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, throwError, debounceTime, distinctUntilChanged } from 'rxjs';
import { Client } from '../models/client';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private baseUrl = 'http://localhost:5199';
  private apiUrl = `${this.baseUrl}/api/Client`; 

  constructor(private http: HttpClient) {}

  getClients(searchTerm?: string): Observable<Client[]> {
    let params = new HttpParams();
    if (searchTerm && searchTerm.trim()) {
      params = params.set('search', searchTerm.trim());
    }
    
    return this.http.get<Client[]>(this.apiUrl, { params }).pipe(
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

  // Alternative search method using dedicated search endpoint
  searchClients(term: string): Observable<Client[]> {
    if (!term || !term.trim()) {
      return this.getClients();
    }
    
    const url = `${this.apiUrl}/search/${encodeURIComponent(term.trim())}`;
    return this.http.get<Client[]>(url).pipe(
      map(clients => clients || []),
      catchError(this.handleError<Client[]>('searchClients', []))
    );
  }

  // Client-side filtering (fallback option)
  filterClientsLocally(clients: Client[], searchTerm: string): Client[] {
    if (!searchTerm || !searchTerm.trim()) {
      return clients;
    }

    const term = searchTerm.toLowerCase().trim();
    return clients.filter(client => {
      return (
        client.name?.toLowerCase().includes(term) ||
        client.phone?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.companyName?.toLowerCase().includes(term) ||
        client.address?.toLowerCase().includes(term)
      );
    });
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