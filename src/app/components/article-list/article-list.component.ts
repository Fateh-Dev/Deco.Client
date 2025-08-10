import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ArticleService } from '../../services/article.service';
import { CategoryService } from '../../services/category.service';
import { Article } from '../../models/article';
import { Category } from '../../models/category';
import { CreateArticleComponent } from './create-article/create-article.component';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    CreateArticleComponent
  ],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss']
})
export class ArticleListComponent implements OnInit {
  articles: Article[] = [];
  filteredArticles: Article[] = [];
  categories: Category[] = [];
  loading = true;
  selectedCategoryId: number | null = null;
  searchTerm = '';
  showCreateModal = false;
  private allArticles: Article[] = [];

  constructor(
    private articleService: ArticleService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadArticles();
    this.loadCategories();
  }

  private filterArticles(): void {
    let result = [...this.allArticles];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      result = result.filter(article => 
        article.name.toLowerCase().includes(searchLower) || 
        (article.description && article.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (this.selectedCategoryId !== null) {
      result = result.filter(article => article.categoryId === this.selectedCategoryId);
    }

    this.filteredArticles = result;
  }

  loadArticles(): void {
    this.loading = true;
    this.articleService.getArticles().subscribe({
      next: (articles) => {
        this.allArticles = articles;
        this.filterArticles();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading articles:', error);
        this.loading = false;
      }
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategoryId = categoryId;
    this.filterArticles();
  }

  onSearch(): void {
    this.filterArticles();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterArticles();
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onArticleCreated(article: Article): void {
    // Add the new article to the list and close the modal
    this.allArticles.unshift(article);
    this.filterArticles();
    this.closeCreateModal();
  }

  deleteArticle(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      this.articleService.deleteArticle(id).subscribe({
        next: () => {
          this.allArticles = this.allArticles.filter(article => article.id !== id);
          this.filterArticles();
        },
        error: (error) => {
          console.error('Error deleting article:', error);
          alert('Erreur lors de la suppression de l\'article');
        }
      });
    }
  }
}