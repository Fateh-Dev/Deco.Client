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

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
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

  createAlbum(album: { title: string; description?: string; coverImageUrl?: string }): Observable<Album> {
    return this.http.post<Album>(this.apiUrl, album, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      map(createdAlbum => ({
        ...createdAlbum,
        createdAt: new Date(createdAlbum.createdAt)
      }))
    );
  }

  updateAlbum(
    id: number, 
    album: { title?: string; description?: string; coverImageUrl?: string },
    coverImageFile?: File
  ): Observable<Album> {
    const formData = new FormData();
    
    // Add album properties to form data if they exist
    if (album.title) formData.append('title', album.title);
    if (album.description !== undefined) formData.append('description', album.description || '');
    if (coverImageFile) formData.append('coverImage', coverImageFile);

    return this.http.put<Album>(`${this.apiUrl}/${id}`, formData, { 
      headers: this.getAuthHeaders() 
    });
  }

  deleteAlbum(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Image methods
  getAlbumImages(albumId: number, page: number = 1, pageSize: number = 20): Observable<PaginatedResponse<Image>> {
    const params = {
      pageNumber: page.toString(),
      pageSize: pageSize.toString()
    };
    
    return this.http.get<PaginatedResponse<Image>>(`${this.apiUrl}/${albumId}/images`, { 
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      map(response => ({
        ...response,
        items: response.items.map(image => ({
          ...image,
          uploadedAt: new Date(image.uploadedAt)
        }))
      }))
    );
  }

  uploadImage(albumId: number, file: File, title?: string, description?: string): Observable<{progress?: number, image?: Image}> {
    const formData = new FormData();
    
    // Create a new File object to ensure proper content type for .jfif files
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileType = fileExt === 'jfif' ? 'image/jpeg' : file.type;
    const blob = file.slice(0, file.size, fileType);
    const renamedFile = new File([blob], file.name, { type: fileType });
    
    formData.append('file', renamedFile);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);

    const req = new HttpRequest(
      'POST',
      `${this.apiUrl}/${albumId}/images`,
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
    return this.http.delete<void>(`${this.apiUrl}/images/${imageId}`, {
      headers: this.getAuthHeaders() // Fixed: Added missing auth headers
    });
  }
}