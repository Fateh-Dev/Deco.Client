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
  editingArticle: Article | null = null;
  
  // Delete modal state
  showDeleteModal = false;
  articleToDelete: Article | null = null;
  isDeleting = false;
  
  private allArticles: Article[] = [];

  // Category navigation properties
  scrollOffset = 0;
  canScrollLeft = false;
  canScrollRight = true;
  currentScrollPage = 0;
  scrollDots: number[] = [];
  private readonly itemsPerPage = 3;
  private readonly scrollAmount = 300;

  @ViewChild('categoriesContainer', { static: false }) categoriesContainer!: ElementRef;

  constructor(
    private articleService: ArticleService,
    private categoryService: CategoryService
  ) { }

  ngOnInit(): void {
    this.loadCategories(); // Load categories first
    this.loadArticles();
  }

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

  toggleSortOrder(): void {
    this.isSortDescending = !this.isSortDescending;
    console.log('Toggle sort order to:', this.isSortDescending ? 'Z-A' : 'A-Z');
    this.filterArticles();
  }

  private filterArticles(): void {
    console.log('=== Starting filterArticles ===');
    console.log('All articles:', this.allArticles.length);
    console.log('Categories loaded:', this.categories.length);
    console.log('Sort descending:', this.isSortDescending);
    
    let result = [...this.allArticles];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      result = result.filter(article =>
        article.name.toLowerCase().includes(searchLower) ||
        (article.description && article.description.toLowerCase().includes(searchLower))
      );
      console.log('After search filter:', result.length);
    }

    // Apply category filter
    if (this.selectedCategoryId !== null) {
      result = result.filter(article => article.categoryId === this.selectedCategoryId);
      console.log('After category filter:', result.length);
    }

    // Sort articles by category name first, then by article name
    this.filteredArticles = this.sortArticlesByCategory(result);
    console.log('Final sorted articles:', this.filteredArticles.length);
    console.log('=== End filterArticles ===');
  }

  private sortArticlesByCategory(articles: Article[]): Article[] {
    // 1️⃣ Group articles by category name
    const grouped = articles.reduce((acc, article) => {
      const categoryName = this.getCategoryName(article.categoryId);
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(article);
      return acc;
    }, {} as Record<string, Article[]>);
  
    // 2️⃣ Sort category names alphabetically (A-Z or Z-A)
    const sortedCategoryNames = Object.keys(grouped).sort((a, b) =>
      this.isSortDescending
        ? b.localeCompare(a)
        : a.localeCompare(b)
    );
  
    // 3️⃣ Build the sorted article list
    const sortedArticles: Article[] = [];
    for (const categoryName of sortedCategoryNames) {
      const articlesInCategory = grouped[categoryName];
  
      // Sort articles inside the same category
      articlesInCategory.sort((a, b) =>
        this.isSortDescending
          ? b.name.localeCompare(a.name)
          : a.name.localeCompare(b.name)
      );
  
      sortedArticles.push(...articlesInCategory);
    }
  
    return sortedArticles;
  }
  
  
  private getCategoryName(categoryId: number | null | undefined): string {
    if (!categoryId) return ''; // Uncategorized
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || '';
  }

  loadArticles(): void {
    this.loading = true;
    this.articleService.getArticles().subscribe({
      next: (articles) => {
        console.log('Articles loaded:', articles);
        this.allArticles = articles;
        // Only filter if categories are already loaded
        if (this.categories.length > 0) {
          this.filterArticles();
        }
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
        console.log('Categories loaded:', categories);
        this.categories = categories;
        // Re-filter articles after categories are loaded
        if (this.allArticles.length > 0) {
          this.filterArticles();
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onSearch(): void {
    this.filterArticles();
  }

  openCreateModal(article?: Article): void {
    this.editingArticle = article || null;
    this.showCreateModal = true;
  }

  editArticle(article: Article): void {
    this.openCreateModal(article);
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.editingArticle = null;
  }

  onArticleCreated(article: Article): void {
    console.log('Article to save:', article);
    console.log('Currently editing article:', this.editingArticle);
    
    // Check if we're in edit mode by looking at the article ID
    const isEditMode = article.id !== undefined && article.id !== null && article.id > 0;
    
    console.log('Is edit mode:', isEditMode);
    console.log('Article ID:', article.id);
    
    if (isEditMode) {
      console.log('Updating existing article with ID:', article.id);
      this.articleService.updateArticle(article.id!, article).subscribe({
        next: (updatedArticle) => {
          console.log('Article updated successfully:', updatedArticle);
          // Refresh the articles list to get the latest data
          this.loadArticles();
          this.closeCreateModal();
        },
        error: (error) => {
          console.error('Error updating article:', error);
          alert('Erreur lors de la mise à jour de l\'article. Veuillez réessayer.');
        }
      });
    } else {
      console.log('Creating new article');
      this.articleService.createArticle(article).subscribe({
        next: (createdArticle) => {
          console.log('Article created successfully:', createdArticle);
          // Refresh the articles list to include the new article
          this.loadArticles();
          this.closeCreateModal();
        },
        error: (error) => {
          console.error('Error creating article:', error);
          alert('Erreur lors de la création de l\'article. Veuillez réessayer.');
        }
      });
    }
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

  openDeleteModal(article: Article): void {
    this.articleToDelete = article;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.articleToDelete = null;
    this.isDeleting = false;
  }

  confirmDelete(): void {
    if (!this.articleToDelete?.id) {
      return;
    }

    this.isDeleting = true;
    const articleId = this.articleToDelete.id;

    this.articleService.deleteArticle(articleId).subscribe({
      next: () => {
        this.allArticles = this.allArticles.filter(article => article.id !== articleId);
        this.filterArticles();
        this.closeDeleteModal();
        // You could add a success toast/message here
      },
      error: (error) => {
        console.error('Error deleting article:', error);
        // You could show an error message here
        this.isDeleting = false;
      }
    });
  }

  cancelDelete(): void {
    this.closeDeleteModal();
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