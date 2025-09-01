import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GalleryService, Album, Image } from '../../services/gallery.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {
  // Make Math available in the template
  Math = Math;
  albums: Album[] = [];
  selectedAlbum: Album | null = null;
  images: Image[] = [];
  pagination = {
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  };
  isLoading = false;
  isUploading = false;
  uploadProgress = 0;
  error: string | null = null;
  selectedImage: Image | null = null;

  // New album form
  showNewAlbumModal = false;
  newAlbum = {
    title: '',
    description: '',
    coverImageFile: null as File | null,
    coverImageUrl: ''
  };

  constructor(private galleryService: GalleryService) {}

  ngOnInit() {
    this.loadAlbums();
  }

  // Load all albums
  loadAlbums() {
    this.isLoading = true;
    this.galleryService.getAlbums().subscribe({
      next: (albums) => {
        this.albums = albums;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading albums:', error);
        this.error = 'Failed to load albums. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Select an album and load its images
  selectAlbum(album: Album) {
    this.selectedAlbum = album;
    this.loadAlbumImages(album.id);
    
    // If album has no cover image but has images, set the first one as cover
    if ((!album.coverImageUrl || album.coverImageUrl === '') && this.images.length > 0) {
      this.updateAlbumCover(this.images[0].fileUrl);
    }
  }

  // Load images for selected album
  loadAlbumImages(albumId: number, page: number = 1) {
    this.isLoading = true;
    this.galleryService.getAlbumImages(albumId, page, this.pagination.pageSize).subscribe({
      next: (response) => {
        this.images = response.items;
        this.pagination = {
          currentPage: response.pageNumber,
          pageSize: response.pageSize,
          totalItems: response.totalItems,
          totalPages: response.totalPages,
          hasPreviousPage: response.hasPreviousPage,
          hasNextPage: response.hasNextPage
        };
        this.isLoading = false;
        
        // If album has no cover image but has images, set the first one as cover
        if (this.selectedAlbum && (!this.selectedAlbum.coverImageUrl || this.selectedAlbum.coverImageUrl === '') && this.images.length > 0) {
          this.updateAlbumCover(this.images[0].fileUrl);
        }
      },
      error: (error) => {
        console.error('Error loading album images:', error);
        this.error = 'Failed to load album images. Please try again.';
        this.isLoading = false;
      }
    });
  }

  changePage(page: number | string) {
    const pageNumber = typeof page === 'string' ? parseInt(page, 10) : page;
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > this.pagination.totalPages) return;
    this.pagination.currentPage = pageNumber;
    this.loadAlbumImages(this.selectedAlbum!.id, pageNumber);
    window.scrollTo(0, 0);
  }

  getPageNumbers(): (number | string)[] {
    const current = this.pagination.currentPage;
    const total = this.pagination.totalPages;
    const delta = 2;
    const range = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    range.push(1);
    
    for (let i = current - delta; i <= current + delta; i++) {
      if (i < total && i > 1) {
        range.push(i);
      }
    }  
    
    if (total > 1) {
      range.push(total);
    }
    
    range.sort((a, b) => a - b);
    
    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }

  // Handle file selection
 
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }
  
    const files = Array.from(input.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jfif'];
  
    const validFiles = files.filter(file => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const isImageType = file.type.startsWith('image/') || 
                         (fileExt === 'jfif' && file.type === '') ||
                         allowedTypes.includes(file.type);
      
      if (!isImageType) {
        this.error = `Invalid file type: ${file.name}. Only images (JPG, PNG, GIF, WebP, JFIF) are allowed.`;
        return false;
      }
      if (file.size > maxSize) {
        this.error = `File too large: ${file.name}. Max size is 5MB.`;
        return false;
      }
      return true;
    });
  
    if (validFiles.length === 0) return;
  
    this.uploadFiles(validFiles);
  }

  // Upload multiple files
  private uploadFiles(files: File[]) {
    this.isUploading = true;
    this.uploadProgress = 0;
    let completedUploads = 0;
    const totalUploads = files.length;

    files.forEach((file: File) => {
      const fileName = file.name.split('.')[0];
      
      this.galleryService.uploadImage(
        this.selectedAlbum!.id,
        file,
        fileName,
        ''
      ).subscribe({
        next: (event) => {
          if (event.progress !== undefined) {
            this.uploadProgress = Math.round(
              ((completedUploads * 100) + event.progress) / totalUploads
            );
          }
          
          if (event.image) {
            this.images = [event.image, ...this.images];
            completedUploads++;

            // Update album cover if first image
            if (this.images.length === 1 && this.selectedAlbum) {
              this.updateAlbumCover(event.image.fileUrl);
            }

            // Check if all uploads are done
            if (completedUploads === totalUploads) {
              this.isUploading = false;
              this.uploadProgress = 0;
              this.updateAlbumImageCount();
            }
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.error = `Error uploading ${file.name}. Please try again.`;
          this.isUploading = false;
        }
      });
    });
  }

  // Helper to update album cover
  private updateAlbumCover(imageUrl: string) {
    if (!this.selectedAlbum) return;
    
    this.selectedAlbum.coverImageUrl = imageUrl;
    const albumIndex = this.albums.findIndex(a => a.id === this.selectedAlbum?.id);
    if (albumIndex !== -1) {
      this.albums[albumIndex].coverImageUrl = imageUrl;
    }
  }

  // Helper to update image count
  private updateAlbumImageCount() {
    if (!this.selectedAlbum) return;
    
    const albumIndex = this.albums.findIndex(a => a.id === this.selectedAlbum?.id);
    if (albumIndex !== -1) {
      this.albums[albumIndex].imageCount = this.images.length;
    }
  }

  // Handle cover image selection
  onCoverImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jfif'];
    
    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isImageType = file.type.startsWith('image/') || 
                       (fileExt === 'jfif' && file.type === '') ||
                       allowedTypes.includes(file.type);
    
    if (!isImageType) {
      this.error = 'Invalid file type. Only images are allowed (JPG, PNG, GIF, WEBP, JFIF).';
      return;
    }
    
    if (file.size > maxSize) {
      this.error = 'File is too large. Maximum size is 5MB.';
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.newAlbum.coverImageUrl = e.target.result;
      this.newAlbum.coverImageFile = file;
    };
    reader.readAsDataURL(file);
  }

  // Create new album
  createAlbum() {
    if (!this.newAlbum.title.trim()) {
      return;
    }
  
    this.isLoading = true;
    
    // If there's a cover image file, upload it first
    if (this.newAlbum.coverImageFile) {
      // First upload the cover image with 'cover' title
      const formData = new FormData();
      formData.append('file', this.newAlbum.coverImageFile);
      formData.append('title', 'cover');
      formData.append('description', 'Album cover image');
      
      // Create a temporary album first
      this.galleryService.createAlbum({
        title: this.newAlbum.title.trim(),
        description: this.newAlbum.description.trim()
      }).subscribe({
        next: (album) => {
          // Now upload the cover image
          this.galleryService.uploadImage(
            album.id,
            this.newAlbum.coverImageFile!,
            'cover',
            'Album cover image'
          ).subscribe({
            next: (event) => {
              if (event.image) {
                // The image is already saved in albums-thumbnails folder, update the album with the URL
                this.galleryService.updateAlbum(album.id, {
                  coverImageUrl: `/uploads/albums-thumbnails/${event.image.fileName}`
                }).subscribe({
                  next: (updatedAlbum) => {
                    this.isLoading = false;
                    this.showNewAlbumModal = false;
                    this.loadAlbums();
                    // Reset form
                    this.newAlbum = {
                      title: '',
                      description: '',
                      coverImageFile: null,
                      coverImageUrl: ''
                    };
                  },
                  error: (error) => {
                    this.isLoading = false;
                    this.error = 'Failed to update album cover';
                    console.error('Update album error:', error);
                  }
                });
              }
            },
            error: (error) => {
              this.isLoading = false;
              this.error = 'Failed to upload cover image';
              console.error('Upload error:', error);
            }
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.error = 'Failed to create album';
          console.error('Create album error:', error);
        }
      });
    } else {
      // If no cover image, just create the album
      this.galleryService.createAlbum({
        title: this.newAlbum.title.trim(),
        description: this.newAlbum.description.trim()
      }).subscribe({
        next: (album) => {
          this.isLoading = false;
          this.showNewAlbumModal = false;
          this.loadAlbums();
          // Reset form
          this.newAlbum = {
            title: '',
            description: '',
            coverImageFile: null,
            coverImageUrl: ''
          };
        },
        error: (error) => {
          this.isLoading = false;
          this.error = 'Failed to create album';
          console.error('Create album error:', error);
        }
      });
    }
  }
  private finishAlbumCreation(album: Album) {
    // Reset form and close modal
    this.newAlbum = {
      title: '',
      description: '',
      coverImageFile: null,
      coverImageUrl: ''
    };
    this.showNewAlbumModal = false;
    this.isLoading = false;
    
    // Reload albums to show the new one
    this.loadAlbums();
  }

  // Delete an image
  deleteImage(imageId: number, event: Event) {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this image?')) return;

    this.galleryService.deleteImage(imageId).subscribe({
      next: () => {
        this.images = this.images.filter(img => img.id !== imageId);
        this.updateAlbumImageCount();
        
        // If no images left, update cover
        if (this.images.length === 0 && this.selectedAlbum) {
          this.updateAlbumCover('');
        }
      },
      error: (error) => {
        console.error('Error deleting image:', error);
        this.error = 'Failed to delete image. Please try again.';
      }
    });
  }

  // View image in modal
  viewImage(image: Image) {
    this.selectedImage = image;
  }

  // Close image modal
  closeImageModal() {
    this.selectedImage = null;
  }

  // Clear error message
  clearError() {
    this.error = null;
  }

  // Go back to albums view
  goBackToAlbums() {
    this.selectedAlbum = null;
    this.images = [];
  }
}