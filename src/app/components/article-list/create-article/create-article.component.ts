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
    imageUrl: ''
  };

  onSubmit(): void {
    if (this.isFormValid()) {
      const now = new Date();
      const article: Article = {
        ...this.newArticle,
        id: 0, // Will be set by the server
        categoryId: this.newArticle.categoryId || 0, // Default to 0 if undefined
        createdAt: now,
        // updatedAt: now
      };
      this.articleCreated.emit(article);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private isFormValid(): boolean {
    return !!this.newArticle.name &&
      this.newArticle.pricePerDay !== undefined &&
      this.newArticle.pricePerDay >= 0 &&
      this.newArticle.quantityTotal !== undefined &&
      this.newArticle.quantityTotal > 0;
  }
}
