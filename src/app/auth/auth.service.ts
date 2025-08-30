import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from 'rxjs/operators';

function parseJwt(token: string): any {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private apiUrl = "http://localhost:5000/api/auth";

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password });
  }

  register(name: string, email: string, phone: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { name, email, phone, password });
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem("token");
    if (!token) return false;
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return false;
    return Date.now() < payload.exp * 1000;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        return throwError(() => ({
          error: { message: 'No authentication token found. Please log in again.' }
        }));
      }

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      return this.http.post<{ message: string }>(
        `${this.apiUrl}/change-password`,
        { currentPassword, newPassword },
        { 
          headers,
          withCredentials: true // Ensure credentials are sent with the request
        }
      ).pipe(
        catchError((error: any) => {
          console.error('Error changing password:', error);
          
          // Handle different types of errors
          let errorMessage = 'An error occurred while changing password';
          
          if (error.status === 401) {
            // If unauthorized, clear the token as it might be invalid/expired
            this.logout();
            errorMessage = 'Your session has expired. Please log in again.';
          } else if (error.status === 400) {
            errorMessage = error.error?.message || error.error || 'Current password is incorrect';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 0) {
            errorMessage = 'Unable to connect to the server. Please check your connection.';
          }
          
          return throwError(() => ({
            error: { message: errorMessage }
          }));
        })
      );
    } catch (error: any) {
      console.error('Unexpected error in changePassword:', error);
      return throwError(() => ({
        error: { message: 'An unexpected error occurred. Please try again.' }
      }));
    }
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}