import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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
  isSortDescending = false;
  showFilters = false; // Controls visibility of category filters
  private allArticles: Article[] = [];

  getUniqueCategories(articles: Article[]): (Category | { id: undefined, name: string })[] {
    const categoryMap = new Map<number | undefined, Category | { id: undefined, name: string }>();
    
    // Add all categories from articles
    articles.forEach(article => {
      if (article.category) {
        categoryMap.set(article.category.id, article.category);
      } else if (!categoryMap.has(undefined)) {
        categoryMap.set(undefined, { id: undefined, name: 'Sans catégorie' });
      }
    });

    // Convert map values to array and sort
    return Array.from(categoryMap.values())
      .sort((a, b) => (a.name || '').localeCompare(b?.name || ''));
  }

  getArticlesByCategory(articles: Article[], categoryId?: number): Article[] {
    return articles.filter(article => {
      if (categoryId === undefined) {
        return !article.categoryId;
      }
      return article.categoryId === categoryId;
    });
  }

  constructor(
    private articleService: ArticleService,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.loadArticles();
    this.loadCategories();
  }

  toggleSortOrder(): void {
    this.isSortDescending = !this.isSortDescending;
    this.filterArticles();
  }

  private sortArticles(articles: Article[]): Article[] {
    return [...articles].sort((a, b) => {
      // First sort by category name
      const categoryCompare = (a.category?.name || '').localeCompare(b.category?.name || '');
      if (categoryCompare !== 0) {
        return this.isSortDescending ? -categoryCompare : categoryCompare;
      }
      // Then by article name
      return this.isSortDescending 
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name);
    });
  }

  private groupArticlesByCategory(articles: Article[]): Article[] {
    const grouped: Article[] = [];
    const categories = new Map<number, Article[]>();

    // Group articles by category
    articles.forEach(article => {
      const categoryId = article.categoryId || 0;
      if (!categories.has(categoryId)) {
        categories.set(categoryId, []);
      }
      categories.get(categoryId)?.push(article);
    });

    // Sort categories and their articles
    Array.from(categories.entries())
      .sort(([idA], [idB]) => {
        const categoryA = this.categories.find(c => c.id === idA)?.name || '';
        const categoryB = this.categories.find(c => c.id === idB)?.name || '';
        return this.isSortDescending 
          ? categoryB.localeCompare(categoryA)
          : categoryA.localeCompare(categoryB);
      })
      .forEach(([_, categoryArticles]) => {
        // Sort articles within each category
        const sortedArticles = this.sortArticles(categoryArticles);
        grouped.push(...sortedArticles);
      });

    return grouped;
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

    // Sort and group articles
    this.filteredArticles = this.groupArticlesByCategory(result);
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

  // selectCategory(categoryId: number | null): void {
  //   this.selectedCategoryId = categoryId;
  //   this.filterArticles();
  // }

  onSearch(): void {
    this.filterArticles();
  }

  // clearSearch(): void {
  //   this.searchTerm = '';
  //   this.filterArticles();
  // }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onArticleCreated(article: Article): void {
    this.articleService.createArticle(article).subscribe({
      next: (createdArticle) => {
        // Add the new article to the list
        this.loadArticles();
        this.filterArticles();
        this.closeCreateModal();
      },
      error: (error) => {
        console.error('Error creating article:', error);
        alert('Erreur lors de la création de l\'article');
      }
    });
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

  // Category navigation properties
  scrollOffset = 0;
  canScrollLeft = false;
  canScrollRight = true;
  currentScrollPage = 0;
  scrollDots: number[] = [];
  private readonly itemsPerPage = 3;
  private readonly scrollAmount = 300;

  @ViewChild('categoriesContainer', { static: false }) categoriesContainer!: ElementRef;

  ngAfterViewInit() {
    // Initialize scroll state
    setTimeout(() => {
      this.updateScrollState();
    }, 100);
  }

  ngOnChanges() {
    // Update scroll state when categories change
    if (this.categories?.length) {
      this.updateScrollState();
    }
  }

  /**
   * Scroll categories left or right
   */
  scrollCategories(direction: 'left' | 'right'): void {
    const container = this.categoriesContainer?.nativeElement;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const totalWidth = container.scrollWidth;
    
    if (direction === 'left') {
      this.scrollOffset = Math.min(0, this.scrollOffset + this.scrollAmount);
      this.currentScrollPage = Math.max(0, this.currentScrollPage - 1);
    } else {
      const maxScroll = -(totalWidth - containerWidth);
      this.scrollOffset = Math.max(maxScroll, this.scrollOffset - this.scrollAmount);
      this.currentScrollPage = Math.min(this.scrollDots.length - 1, this.currentScrollPage + 1);
    }
    
    this.updateScrollState();
  }

  /**
   * Update scroll state and navigation buttons
   */
  private updateScrollState(): void {
    if (!this.categoriesContainer?.nativeElement) return;
    
    const container = this.categoriesContainer.nativeElement;
    const containerWidth = container.clientWidth;
    const totalWidth = container.scrollWidth;
    
    // Update scroll buttons
    this.canScrollLeft = this.scrollOffset < 0;
    this.canScrollRight = Math.abs(this.scrollOffset) < (totalWidth - containerWidth - 10);
    
    // Calculate scroll dots
    const totalPages = Math.ceil((this.categories.length + 1) / this.itemsPerPage);
    this.scrollDots = Array(Math.max(1, totalPages)).fill(0).map((_, i) => i);
  }

  /**
   * Get selected category name for display
   */
  getSelectedCategoryName(): string {
    if (!this.selectedCategoryId) return '';
    const category = this.categories.find(c => c.id === this.selectedCategoryId);
    return category?.name || '';
  }

  /**
   * Track by function for categories
   */
  trackByCategory(index: number, category: any): any {
    return category.id || index;
  }

  /**
   * Enhanced select category with smooth animation
   */
  selectCategory(categoryId: number | null): void {
    // Add subtle animation feedback
    const button = event?.target as HTMLElement;
    if (button) {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 150);
    }

    this.selectedCategoryId = categoryId;
    // Your existing filter logic here
    this.filterArticles();
  }

  /**
   * Enhanced clear search with animation
   */
  clearSearch(): void {
    this.searchTerm = '';
    // Add subtle animation
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) {
      input.style.transform = 'scale(0.98)';
      setTimeout(() => {
        input.style.transform = '';
      }, 150);
    }
    this.onSearch();
  }
}