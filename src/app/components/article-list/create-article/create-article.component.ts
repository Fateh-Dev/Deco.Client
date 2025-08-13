import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpEventType } from '@angular/common/http';
import { FileUploadService } from '../../../services/file-upload.service';
import { Article } from '../../../models/article';
import { Category } from '../../../models/category';

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.scss']
})
export class CreateArticleComponent {
  @Input() categories: Category[] = [];
  @Input() set article(article: Article | null) {
    if (article) {
      this.isEditMode = true;
      this.newArticle = {
        id: article.id, // Preserve the original ID
        name: article.name,
        description: article.description || '',
        pricePerDay: article.pricePerDay || 0,
        quantityTotal: article.quantityTotal || 1,
        categoryId: article.categoryId,
        imageUrl: article.imageUrl || '',
        isActive: article.isActive !== undefined ? article.isActive : true
      };
      if (article.imageUrl) {
        this.previewUrl = article.imageUrl;
      }
    } else {
      this.isEditMode = false;
      this.resetForm();
    }
  }
  @Output() articleCreated = new EventEmitter<Article>();
  @Output() cancel = new EventEmitter<void>();

  selectedFile: File | null = null;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  uploadError: string | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  isEditMode: boolean = false;

  newArticle = {
    id: undefined as number | undefined,
    name: '',
    description: '',
    pricePerDay: 0,
    quantityTotal: 1,
    categoryId: undefined as number | undefined,
    imageUrl: '',
    isActive: true
  };

  constructor(private fileUploadService: FileUploadService) {}

  private resetForm(): void {
    this.newArticle = {
      id: undefined,
      name: '',
      description: '',
      pricePerDay: 0,
      quantityTotal: 1,
      categoryId: undefined,
      imageUrl: '',
      isActive: true
    };
    this.previewUrl = null;
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.uploadError = null;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) return;
    
    this.isUploading = true;
    this.uploadProgress = 0;
    
    this.fileUploadService.upload(this.selectedFile).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / (event.total || 1));
        } else if (event.type === HttpEventType.Response) {
          // Assuming the server responds with the file URL
          this.newArticle.imageUrl = event.body.fileUrl;
          this.isUploading = false;
        }
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.uploadError = 'Échec du téléversement de l\'image. Veuillez réessayer.';
        this.isUploading = false;
      }
    });
  }

  onSubmit(): void {
    if (!this.isFormValid()) {
      return;
    }

    // If there's a selected file but no image URL yet, upload the file first
    if (this.selectedFile && !this.newArticle.imageUrl) {
      this.isUploading = true;
      this.uploadProgress = 0;
      
      this.fileUploadService.upload(this.selectedFile).subscribe({
        next: (event: any) => {
          console.log('Upload event:', event);
          
          if (event.type === HttpEventType.UploadProgress) {
            // Update progress
            this.uploadProgress = Math.round(100 * event.loaded / (event.total || 1));
          } else if (event.type === HttpEventType.Response) {
            // Handle successful upload
            try {
              if (event.body && event.body.fileUrl) {
                this.newArticle.imageUrl = event.body.fileUrl;
                this.uploadError = null;
                this.isUploading = false;
                // Now that we have the image URL, submit the form
                this.submitArticle();
              } else {
                throw new Error('Invalid server response: Missing fileUrl');
              }
            } catch (e) {
              console.error('Error processing upload response:', e);
              this.uploadError = 'Erreur lors du traitement de la réponse du serveur.';
              this.isUploading = false;
            }
          }
        },
        error: (error) => {
          console.error('Upload failed:', error);
          let errorMessage = 'Échec du téléversement de l\'image. Veuillez réessayer.';
          
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.status === 400) {
            errorMessage = 'Format de fichier non valide. Seuls les JPG, JPEG, PNG et GIF sont acceptés.';
          } else if (error.status === 0) {
            errorMessage = 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion.';
          }
          
          this.uploadError = errorMessage;
          this.isUploading = false;
        }
      });
    } else {
      // If no file to upload or file is already uploaded, submit the form
      this.submitArticle();
    }
  }

  private submitArticle(): void {
    const now = new Date();
    const article: Article = {
      ...this.newArticle,
      name: this.newArticle.name.trim(),
      categoryId: this.newArticle.categoryId ?? 0,
      quantityTotal: this.newArticle.quantityTotal ?? 1,
      pricePerDay: this.newArticle.pricePerDay || 0,
      imageUrl: this.newArticle.imageUrl || '',
      // FIXED: Don't override the ID, preserve it for updates
      id: this.newArticle.id, // This will be undefined for new articles and the actual ID for updates
      createdAt: now,
      isActive: this.newArticle.isActive ?? true
    };
    
    console.log('Submitting article:', article);
    console.log('Is edit mode:', this.isEditMode);
    console.log('Article ID:', article.id);
    
    this.articleCreated.emit(article);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  isFormValid(): boolean {
    return !!this.newArticle.name?.trim() && // Name is required
           this.newArticle.categoryId !== undefined && // Category is required
           (this.newArticle.quantityTotal ?? 0) > 0 && // Quantity must be positive
           (this.newArticle.pricePerDay ?? 0) >= 0; // Price can't be negative
  }
}