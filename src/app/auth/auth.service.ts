import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

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
}
