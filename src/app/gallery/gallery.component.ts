import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GalleryService, Album, Image } from '../services/gallery.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit {
  albums: Album[] = [];
  selectedAlbum: Album | null = null;
  images: Image[] = [];
  isLoading = false;
  isUploading = false;
  uploadProgress = 0;
  newAlbum = {
    title: '',
    description: '',
    coverImageUrl: ''
  };
  showNewAlbumModal = false;
  error: string | null = null;
  selectedImageForView: Image | null = null;

  constructor(private galleryService: GalleryService) {}

  ngOnInit() {
    this.loadAlbums();
  }

  loadAlbums() {
    this.isLoading = true;
    this.galleryService.getAlbums().subscribe({
      next: (albums) => {
        this.albums = albums;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading albums:', error);
        this.error = 'Erreur lors du chargement des albums. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  selectAlbum(album: Album) {
    this.selectedAlbum = album;
    this.loadAlbumImages(album.id);
  }

  loadAlbumImages(albumId: number) {
    this.isLoading = true;
    this.galleryService.getAlbumImages(albumId).subscribe({
      next: (images) => {
        this.images = images;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading album images:', error);
        this.error = 'Erreur lors du chargement des images. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  openNewAlbumModal() {
    this.showNewAlbumModal = true;
    this.newAlbum = { title: '', description: '', coverImageUrl: '' };
  }

  closeNewAlbumModal() {
    this.showNewAlbumModal = false;
    this.newAlbum = { title: '', description: '', coverImageUrl: '' };
  }

  createAlbum() {
    if (!this.newAlbum.title.trim()) return;
    
    this.isLoading = true;
    
    const albumData = {
      title: this.newAlbum.title,
      description: this.newAlbum.description,
      ...(this.newAlbum.coverImageUrl && { coverImageUrl: this.newAlbum.coverImageUrl })
    };

    this.galleryService.createAlbum(albumData).subscribe({
      next: (album) => {
        this.albums = [album, ...this.albums];
        this.closeNewAlbumModal();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating album:', error);
        this.error = 'Erreur lors de la création de l\'album. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0 || !this.selectedAlbum) return;

    this.isUploading = true;
    this.uploadProgress = 0;
    
    Array.from(files).forEach((file: any) => {
      this.galleryService.uploadImage(
        this.selectedAlbum!.id,
        file,
        file.name.split('.')[0],
        ''
      ).subscribe({
        next: (event) => {
          if (event.progress !== undefined) {
            this.uploadProgress = event.progress;
          }
          
          if (event.image) {
            this.images = [event.image, ...this.images];
            
            if (this.images.length === 1 && this.selectedAlbum) {
              this.selectedAlbum.coverImageUrl = event.image.fileUrl;
            }
            
            this.isUploading = false;
            this.uploadProgress = 0;
          }
        },
        error: (error) => {
          console.error('Error uploading image:', error);
          this.error = 'Erreur lors du téléchargement de l\'image. Veuillez réessayer.';
          this.isUploading = false;
          this.uploadProgress = 0;
        }
      });
    });
    
    event.target.value = '';
  }

  deleteImage(imageId: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) {
      return;
    }
    
    this.galleryService.deleteImage(imageId).subscribe({
      next: () => {
        this.images = this.images.filter(img => img.id !== imageId);
        
        if (this.selectedAlbum && this.images.length > 0) {
          this.selectedAlbum.coverImageUrl = this.images[0].fileUrl;
        } else if (this.selectedAlbum) {
          this.selectedAlbum.coverImageUrl = undefined;
        }
      },
      error: (error) => {
        console.error('Error deleting image:', error);
        this.error = 'Erreur lors de la suppression de l\'image. Veuillez réessayer.';
      }
    });
  }

  viewImage(image: Image) {
    this.selectedImageForView = image;
  }

  closeImageView() {
    this.selectedImageForView = null;
  }

  clearError() {
    this.error = null;
  }

  goBackToAlbums() {
    this.selectedAlbum = null;
    this.images = [];
  }
}