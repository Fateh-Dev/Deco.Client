import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Article } from '../../../models/article';
import { Category } from '../../../models/category';

@Component({
  selector: 'app-create-article',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-article.component.html',
  styleUrls: ['./create-article.component.scss']
})
export class CreateArticleComponent {
  @Input() categories: Category[] = [];
  @Output() articleCreated = new EventEmitter<Article>();
  @Output() cancel = new EventEmitter<void>();

  newArticle = {
    name: '',
    description: '',
    pricePerDay: 0,
    quantityTotal: 1,
    categoryId: undefined as number | undefined,
    imageUrl: '',
    isActive: true
  };

  onSubmit(): void {
    if (this.isFormValid()) {
      const now = new Date();
      const article: Article = {
        ...this.newArticle,
        name: this.newArticle.name.trim(), // Ensure name is not just whitespace
        categoryId: this.newArticle.categoryId ?? 0, // Ensure it's never undefined
        quantityTotal: this.newArticle.quantityTotal ?? 1, // Ensure it has a value
        pricePerDay: this.newArticle.pricePerDay || 0, // Ensure it has a value
        imageUrl: this.newArticle.imageUrl || '', // Ensure it's not undefined
        id: 0, // Will be set by the server
        createdAt: now,
        isActive: this.newArticle.isActive ?? true // Use the value from the form or default to true
      };
      this.articleCreated.emit(article);
    }
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
