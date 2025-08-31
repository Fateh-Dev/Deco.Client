import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ConfigService } from '../core/services/config.service';
import { AuthService } from '../auth/auth.service';

export interface Album {
  id: number;
  title: string;
  description?: string;
  coverImageUrl?: string;
  createdAt: Date;
  imageCount: number;
}

export interface Image {
  id: number;
  albumId: number;
  fileUrl: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  title?: string;
  description?: string;
  uploadedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class GalleryService {
  private apiUrl: string;

  constructor(
    private http: HttpClient, 
    private configService: ConfigService,
    private authService: AuthService
  ) {
    this.apiUrl = this.configService.apiUrl + '/albums';
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      console.warn('No authentication token found. User might not be logged in.');
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Album methods
  getAlbums(): Observable<Album[]> {
    return this.http.get<Album[]>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
      map(albums => albums.map(album => ({
        ...album,
        createdAt: new Date(album.createdAt)
      })))
    );
  }

  getAlbum(id: number): Observable<Album> {
    return this.http.get<Album>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() }).pipe(
      map(album => ({
        ...album,
        createdAt: new Date(album.createdAt)
      }))
    );
  }

  createAlbum(album: { title: string; description?: string }): Observable<Album> {
    return this.http.post<Album>(this.apiUrl, album, { 
      headers: this.getAuthHeaders() 
    });
  }

  updateAlbum(id: number, album: { title?: string; description?: string }): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, album, { 
      headers: this.getAuthHeaders() 
    });
  }

  deleteAlbum(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Image methods
  getAlbumImages(albumId: number): Observable<Image[]> {
    return this.http.get<Image[]>(`${this.apiUrl}/${albumId}/images`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(images => images.map(image => ({
        ...image,
        uploadedAt: new Date(image.uploadedAt)
      })))
    );
  }

  uploadImage(albumId: number, file: File, title?: string, description?: string): Observable<{progress?: number, image?: Image}> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    const req = new HttpRequest(
      'POST',
      `${this.apiUrl}/${albumId}/uploadimage`,
      formData,
      {
        reportProgress: true,
        responseType: 'json',
        headers: this.getAuthHeaders()
      }
    );

    return new Observable(observer => {
      this.http.request<Image>(req).subscribe({
        next: (event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = Math.round(100 * event.loaded / (event.total || 1));
            observer.next({ progress });
          } else if (event.type === HttpEventType.Response) {
            const image = {
              ...event.body!,
              uploadedAt: new Date(event.body!.uploadedAt)
            };
            observer.next({ image });
            observer.complete();
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  deleteImage(imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/images/${imageId}`);
  }
}
