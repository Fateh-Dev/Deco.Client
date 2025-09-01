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

  // Album forms
  showNewAlbumModal = false;
  showEditAlbumModal = false;

  newAlbum = {
    title: '',
    description: '',
    coverImageFile: null as File | null,
    coverImageUrl: ''
  };

  editingAlbum: Album | null = null;
  editAlbumData = {
    title: '',
    description: '',
    coverImageFile: null as File | null,
    coverImageUrl: ''
  };

  constructor(private galleryService: GalleryService) { }

  ngOnInit() {
    this.loadAlbums();
  }

  // Load all albums
  loadAlbums() {
    this.isLoading = true;
    this.error = null;

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
    this.pagination.currentPage = 1; // Reset to first page
    this.loadAlbumImages(album.id, 1);
  }

  // Load images for selected album
  loadAlbumImages(albumId: number, page: number = 1) {
    this.isLoading = true;
    this.error = null;

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

  // Handle file selection for images
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jfif', 'image/bmp'];

    const validFiles = files.filter(file => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const isImageType = file.type.startsWith('image/') ||
        (fileExt === 'jfif' && file.type === '') ||
        allowedTypes.includes(file.type);

      if (!isImageType) {
        this.error = `Invalid file type: ${file.name}. Only images (JPG, PNG, GIF, WebP, JFIF, BMP) are allowed.`;
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
    this.error = null;
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
            // Add new image to the beginning of the list
            this.images = [event.image, ...this.images];
            completedUploads++;

            // Update album image count and cover if needed
            if (this.selectedAlbum) {
              this.selectedAlbum.imageCount++;

              // Update cover if first image and no cover exists
              if (this.selectedAlbum.imageCount === 1 && !this.selectedAlbum.coverImageUrl) {
                this.selectedAlbum.coverImageUrl = event.image.fileUrl;
                // Update in albums list too
                const albumIndex = this.albums.findIndex(a => a.id === this.selectedAlbum?.id);
                if (albumIndex !== -1) {
                  this.albums[albumIndex].coverImageUrl = event.image.fileUrl;
                  this.albums[albumIndex].imageCount = this.selectedAlbum.imageCount;
                }
              }
            }

            // Check if all uploads are done
            if (completedUploads === totalUploads) {
              this.isUploading = false;
              this.uploadProgress = 0;

              // Reload the current page to get accurate pagination
              this.loadAlbumImages(this.selectedAlbum!.id, this.pagination.currentPage);
            }
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.error = `Error uploading ${file.name}: ${error.error?.message || error.message || 'Unknown error'}`;
          this.isUploading = false;
          this.uploadProgress = 0;
        }
      });
    });
  }

  // Handle cover image selection for new album
  onCoverImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jfif', 'image/bmp'];

    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isImageType = file.type.startsWith('image/') ||
      (fileExt === 'jfif' && file.type === '') ||
      allowedTypes.includes(file.type);

    if (!isImageType) {
      this.error = 'Invalid file type. Only images are allowed (JPG, PNG, GIF, WEBP, JFIF, BMP).';
      return;
    }

    if (file.size > maxSize) {
      this.error = 'File is too large. Maximum size is 5MB.';
      return;
    }

    this.error = null; // Clear any previous errors

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.newAlbum.coverImageUrl = e.target.result;
      this.newAlbum.coverImageFile = file;
    };
    reader.readAsDataURL(file);
  }

  // Album CRUD operations
  editAlbum(event: Event, album: Album) {
    event.stopPropagation();
    this.editingAlbum = album;
    this.editAlbumData = {
      title: album.title,
      description: album.description || '',
      coverImageFile: null,
      coverImageUrl: album.coverImageUrl || ''
    };
    this.showEditAlbumModal = true;
    this.error = null;
  }

  onEditCoverImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jfif', 'image/bmp'];

    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isImageType = file.type.startsWith('image/') ||
      (fileExt === 'jfif' && file.type === '') ||
      allowedTypes.includes(file.type);

    if (!isImageType) {
      this.error = 'Invalid file type. Only images are allowed (JPG, PNG, GIF, WEBP, JFIF, BMP).';
      return;
    }

    if (file.size > maxSize) {
      this.error = 'File is too large. Maximum size is 5MB.';
      return;
    }

    this.error = null;

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.editAlbumData.coverImageUrl = e.target.result;
      this.editAlbumData.coverImageFile = file;
    };
    reader.readAsDataURL(file);
  }

  updateAlbum() {
    if (!this.editingAlbum || !this.editAlbumData.title.trim()) {
      this.error = 'Album title is required';
      return;
    }

    this.isLoading = true;
    this.error = null;

    const formData = new FormData();
    formData.append('title', this.editAlbumData.title.trim());

    if (this.editAlbumData.description.trim()) {
      formData.append('description', this.editAlbumData.description.trim());
    }

    if (this.editAlbumData.coverImageFile) {
      formData.append('coverImage', this.editAlbumData.coverImageFile);
    }

    this.galleryService.updateAlbumWithFormData(this.editingAlbum.id, formData).subscribe({
      next: (updatedAlbum) => {
        this.isLoading = false;
        this.showEditAlbumModal = false;
        this.loadAlbums(); // Refresh the albums list
      },
      error: (error) => {
        this.handleAlbumError('Failed to update album', error);
      }
    });
  }

  cancelEditAlbum() {
    this.showEditAlbumModal = false;
    this.editingAlbum = null;
    this.error = null;
  }

  deleteAlbum(event: Event, album: Album) {
    event.stopPropagation();
    if (!confirm(`Are you sure you want to delete the album "${album.title}"? This cannot be undone.`)) {
      return;
    }

    this.isLoading = true;
    this.galleryService.deleteAlbum(album.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.albums = this.albums.filter(a => a.id !== album.id);
        if (this.selectedAlbum?.id === album.id) {
          this.selectedAlbum = null;
          this.images = [];
        }
      },
      error: (error) => {
        this.handleAlbumError('Failed to delete album', error);
      }
    });
  }

  // Create new album
  createAlbum() {
    if (!this.newAlbum.title.trim()) {
      this.error = 'Album title is required';
      return;
    }

    this.isLoading = true;
    this.error = null;

    // Create form data with the exact field names expected by the API
    const formData = new FormData();
    formData.append('title', this.newAlbum.title.trim());

    if (this.newAlbum.description.trim()) {
      formData.append('description', this.newAlbum.description.trim());
    }

    if (this.newAlbum.coverImageFile) {
      formData.append('coverImage', this.newAlbum.coverImageFile);
    }

    this.galleryService.createAlbumWithFormData(formData).subscribe({
      next: (album) => {
        this.finishAlbumCreation(album);
      },
      error: (error) => {
        this.handleAlbumError('Failed to create album', error);
      }
    });
  }

  private handleAlbumError(message: string, error: any) {
    this.isLoading = false;
    this.error = `${message}: ${error.error?.message || error.message || 'Unknown error'}`;
    console.error(`${message}:`, error);
  }

  private finishAlbumCreation(album: Album) {
    // Reset form and close modal
    this.resetNewAlbumForm();
    this.showNewAlbumModal = false;
    this.isLoading = false;

    // Add new album to the beginning of the list
    this.albums = [album, ...this.albums];
  }

  private resetNewAlbumForm() {
    this.newAlbum = {
      title: '',
      description: '',
      coverImageFile: null,
      coverImageUrl: ''
    };
  }

  // Delete an image
  deleteImage(imageId: number, event: Event) {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this image?')) return;

    this.galleryService.deleteImage(imageId).subscribe({
      next: () => {
        // Remove image from current list
        const deletedImage = this.images.find(img => img.id === imageId);
        this.images = this.images.filter(img => img.id !== imageId);

        // Update album image count
        if (this.selectedAlbum) {
          this.selectedAlbum.imageCount = Math.max(0, this.selectedAlbum.imageCount - 1);

          // Update in albums list too
          const albumIndex = this.albums.findIndex(a => a.id === this.selectedAlbum?.id);
          if (albumIndex !== -1) {
            this.albums[albumIndex].imageCount = this.selectedAlbum.imageCount;
          }

          // If deleted image was the cover, the backend will handle updating the cover
          // Reload albums to get the updated cover URL
          if (deletedImage && this.selectedAlbum.coverImageUrl?.includes(deletedImage.fileName)) {
            this.loadAlbums();
          }
        }

        // If we're on a page that no longer has content, go to previous page
        if (this.images.length === 0 && this.pagination.currentPage > 1) {
          this.changePage(this.pagination.currentPage - 1);
        } else if (this.images.length === 0) {
          // Reload current page to update pagination info
          this.loadAlbumImages(this.selectedAlbum!.id, this.pagination.currentPage);
        }
      },
      error: (error) => {
        console.error('Error deleting image:', error);
        this.error = `Failed to delete image: ${error.error?.message || error.message || 'Unknown error'}`;
      }
    });
  }

  // Current image index for navigation
  currentImageIndex = 0;
  
  // Track rotation state for each image
  imageRotations: { [key: number]: number } = {}; // key: imageId, value: rotation in degrees
  
  // Check if current image is first in the album
  get isFirstImage(): boolean {
    return this.currentImageIndex === 0;
  }
  
  // Check if current image is last in the album
  get isLastImage(): boolean {
    return this.currentImageIndex === this.images.length - 1;
  }

  // View image in modal
  viewImage(image: Image) {
    this.selectedImage = image;
    this.currentImageIndex = this.images.findIndex(img => img.id === image.id);
    // Initialize rotation if not set
    if (this.imageRotations[image.id] === undefined) {
      this.imageRotations[image.id] = 0;
    }
    // Focus the modal for keyboard navigation
    setTimeout(() => {
      const modal = document.querySelector('[tabindex="0"]') as HTMLElement;
      if (modal) modal.focus();
    }, 100);
  }
  
  // Rotate image
  rotateImage(degrees: number) {
    if (!this.selectedImage) return;
    
    const currentRotation = this.imageRotations[this.selectedImage.id] || 0;
    const newRotation = (currentRotation + degrees) % 360;
    this.imageRotations[this.selectedImage.id] = newRotation;
    
    // Update the transform style
    const imgElement = document.querySelector('.image-rotatable') as HTMLElement;
    if (imgElement) {
      imgElement.style.transform = `rotate(${newRotation}deg)`;
    }
  }
  
  // Get current rotation for an image
  getImageRotation(imageId: number): string {
    const rotation = this.imageRotations[imageId] || 0;
    return `rotate(${rotation}deg)`;
  }
  
  // Navigate between images
  navigateImage(direction: number) {
    if (direction === -1 && !this.isFirstImage) {
      this.currentImageIndex--;
    } else if (direction === 1 && !this.isLastImage) {
      this.currentImageIndex++;
    } else {
      return; // Don't navigate if at the start/end
    }
    
    this.selectedImage = this.images[this.currentImageIndex];
    
    // Optional: Scroll to the new image in the grid
    const imageElement = document.querySelector(`[data-image-id="${this.selectedImage.id}"]`);
    if (imageElement) {
      imageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
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
    this.pagination.currentPage = 1;
  }

  // Cancel new album creation
  cancelNewAlbum() {
    this.showNewAlbumModal = false;
    this.resetNewAlbumForm();
    this.error = null;
  }

  // Track by function for better performance in ngFor
  trackByImageId(index: number, image: Image): number {
    return image.id;
  }
  // Remove cover image
  removeCoverImage() {
    this.newAlbum.coverImageUrl = '';
    this.newAlbum.coverImageFile = null;
    this.imageUploadError = '';
  }

  // Format file size
  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Additional properties for your component
  isUploadingImage = false;
  imageUploadError = '';

}