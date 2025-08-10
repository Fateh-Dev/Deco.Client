import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { CategoryService } from '../../services/category.service';
import { Article } from '../../models/article';
import { Category } from '../../models/category';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.scss']
})
export class ArticleListComponent implements OnInit {
  articles: Article[] = [];
  categories: Category[] = [];
  loading = true;
  selectedCategoryId: number | null = null;

  constructor(
    private articleService: ArticleService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadArticles();
    this.loadCategories();
  }

  get filteredArticles(): Article[] {
    if (this.selectedCategoryId === null) {
      return this.articles;
    }
    return this.articles.filter(article => article.categoryId === this.selectedCategoryId);
  }

  loadArticles(): void {
    this.loading = true;
    this.articleService.getArticles().subscribe({
      next: (articles) => {
        this.articles = articles;
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
  }

  deleteArticle(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      this.articleService.deleteArticle(id).subscribe({
        next: () => {
          this.articles = this.articles.filter(article => article.id !== id);
        },
        error: (error) => {
          console.error('Error deleting article:', error);
          alert('Erreur lors de la suppression de l\'article');
        }
      });
    }
  }
}