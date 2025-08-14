import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Reservation, ReservationStatus } from '../../../models/reservation';
import { Article } from '../../../models/article';
import { Client } from '../../../models/client';
import { Category } from '../../../models/category';
import { ArticleService } from '../../../services/article.service';
import { ClientService } from '../../../services/client.service';
import { CategoryService } from '../../../services/category.service';
import { ReservationService } from '../../../services/reservation.service';
import { ReservationItem } from '../../../models/reservation-item';

// Extended Article interface for UI purposes
interface ArticleWithTemp extends Article {
  tempQuantity: number;
}

@Component({
  selector: 'app-create-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-reservation.component.html',
  styleUrls: ['./create-reservation.component.scss']
})
export class CreateReservationComponent implements OnInit {
  @Output() reservationCreated = new EventEmitter<Reservation>();
  @Output() cancel = new EventEmitter<void>();

  // Form model
  clients: Client[] = [];
  selectedClientId: number | null = null;
  startDate: Date = new Date();
  endDate: Date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  // For form binding
  startDateString: string = this.formatDate(this.startDate);
  endDateString: string = this.formatDate(this.endDate);
  
  // Article selection
  articles: ArticleWithTemp[] = [];
  categories: Category[] = [];
  filteredArticles: ArticleWithTemp[] = [];
  searchTerm: string = '';
  selectedCategoryFilter: number | null = null;
  
  reservationItems: { articleId: number; quantity: number; article?: Article }[] = [];
  
  // State
  loading = false;
  submitting = false;
  error: string | null = null;
  
  // Drawer state
  isDrawerOpen = false;

  constructor(
    private articleService: ArticleService,
    private clientService: ClientService,
    private categoryService: CategoryService,
    private reservationService: ReservationService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  // Drawer methods
  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  openDrawer(): void {
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  private loadData(): void {
    this.loading = true;
    this.error = null;
    
    // Load clients, articles, and categories in parallel
    const loadClients$ = this.clientService.getClients();
    const loadArticles$ = this.articleService.getArticles();
    const loadCategories$ = this.categoryService.getCategories();
    
    forkJoin([loadClients$, loadArticles$, loadCategories$]).subscribe({
      next: ([clients, articles, categories]: [Client[], Article[], Category[]]) => {
        this.clients = clients;
        // Add tempQuantity property to articles for UI binding
        this.articles = articles.map(article => ({
          ...article,
          tempQuantity: 1
        }));
        this.categories = categories;
        this.filteredArticles = [...this.articles];
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Erreur lors du chargement des données';
        this.loading = false;
        console.error('Error loading data:', err);
      }
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getTodayFormatted(): string {
    return this.formatDate(new Date());
  }

  private parseDate(dateString: string): Date {
    return new Date(dateString);
  }

  onDateChange(): void {
    // If end date is before start date, update it to match start date
    if (this.startDateString && this.endDateString) {
      const start = this.parseDate(this.startDateString);
      const end = this.parseDate(this.endDateString);
      
      if (end < start) {
        this.endDateString = this.startDateString;
      }
    }
  }

  calculateDays(): number {
    if (!this.startDateString || !this.endDateString) return 0;
    const start = this.parseDate(this.startDateString);
    const end = this.parseDate(this.endDateString);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }

  // Search functionality
  onSearch(): void {
    this.filterArticles();
  }

  onCategoryFilter(): void {
    this.filterArticles();
  }

  private filterArticles(): void {
    let filtered = [...this.articles];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(article => 
        article.name.toLowerCase().includes(searchLower) ||
        (article.description && article.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category
    if (this.selectedCategoryFilter !== null) {
      filtered = filtered.filter(article => article.categoryId === this.selectedCategoryFilter);
    }

    // Only show active articles with stock
    filtered = filtered.filter(article => article.isActive && article.quantityTotal > 0);

    this.filteredArticles = filtered;
  }

  getFilteredArticles(): ArticleWithTemp[] {
    return this.filteredArticles;
  }

  addArticleToReservation(article: ArticleWithTemp): void {
    if (!article.tempQuantity || article.tempQuantity < 1) {
      return;
    }

    // Check if article already added
    const existingItem = this.reservationItems.find(item => item.articleId === article.id);
    if (existingItem) {
      existingItem.quantity += article.tempQuantity;
    } else {
      this.reservationItems.push({
        articleId: article.id!,
        quantity: article.tempQuantity,
        article: article
      });
    }

    // Reset tempQuantity
    article.tempQuantity = 1;
    
    // Auto-open drawer when item is added
    if (!this.isDrawerOpen) {
      this.openDrawer();
    }
  }

  removeItem(index: number): void {
    this.reservationItems.splice(index, 1);
  }

  calculateTotalPrice(): number {
    return this.reservationItems.reduce((total, item) => {
      return total + ((item.article?.pricePerDay || 0) * item.quantity);
    }, 0);
  }

  onSubmit(): void {
    // Parse dates from string inputs
    const startDate = this.parseDate(this.startDateString);
    const endDate = this.parseDate(this.endDateString);
    
    // Validate required fields
    if (!this.selectedClientId || !startDate || !endDate) {
      this.error = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (this.reservationItems.length === 0) {
      this.error = 'Veuillez sélectionner au moins un article';
      return;
    }
    
    // Calculate total price based on selected articles and duration
    const days = this.calculateDays();
    const totalPrice = this.calculateTotalPrice() * days;
    
    // Create reservation items
    const reservationItems = this.reservationItems.map(item => ({
      articleId: item.articleId,
      quantity: item.quantity,
      unitPrice: item.article?.pricePerDay || 0,
      durationDays: days,
      reservationId: 0, // Will be set by the server
      article: undefined // Don't send the full article to the server
    } as ReservationItem));
    
    // Create a new reservation object with proper types
    const newReservation: Reservation = {
      clientId: this.selectedClientId,
      startDate: startDate,
      endDate: endDate,
      status: ReservationStatus.EnAttente,
      totalPrice: totalPrice,
      createdAt: new Date(),
      isActive: true,
      reservationItems: reservationItems
    };
    
    // Submit the reservation
    this.submitting = true;
    this.error = null;
    
    this.reservationService.createReservation(newReservation).subscribe({
      next: (createdReservation) => {
        this.submitting = false;
        this.reservationCreated.emit(createdReservation);
      },
      error: (err) => {
        this.submitting = false;
        this.error = 'Erreur lors de la création de la réservation';
        console.error('Error creating reservation:', err);
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }
}