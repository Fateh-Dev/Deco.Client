import { Injectable } from '@angular/core';
import { 
  HttpClient, 
  HttpEvent, 
  HttpRequest, 
  HttpEventType, 
  HttpHeaders, 
  HttpResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private baseUrl = 'http://localhost:5199';
  private apiUrl = `${this.baseUrl}/api/Articles/upload`;

  constructor(private http: HttpClient) {}

  upload(file: File): Observable<HttpEvent<any>> {
    // Create FormData object
    const formData = new FormData();
    formData.append('file', file, file.name);

    // Create request options
    const options = {
      reportProgress: true,
      observe: 'events' as const,
      responseType: 'json' as const,
      withCredentials: false // Disable credentials for CORS
    };

    // Make the request
    return this.http.post(this.apiUrl, formData, options).pipe(
      map((event: any) => {
        // Convert to HttpEvent
        if (event instanceof HttpResponse) {
          // Get the relative URL from the response
          let fileUrl = event.body?.fileUrl;
          
          // If we have a full URL, convert it to a relative path
          if (fileUrl?.startsWith('http')) {
            const url = new URL(fileUrl);
            fileUrl = url.pathname;
          }
          
          // Update the response with the relative URL
          if (event.body) {
            event.body.fileUrl = fileUrl;
          }
          return { type: HttpEventType.Response, body: event.body };
        }
        return event;
      }),
      catchError((error: any) => {
        console.error('Upload error:', error);
        return throwError(() => error);
      })
    );
  }
}
