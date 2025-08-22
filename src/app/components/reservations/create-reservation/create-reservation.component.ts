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
import { CreateReservationRequest, ReservationService } from '../../../services/reservation.service';
import { ReservationItem } from '../../../models/reservation-item';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

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
  endDate: Date = new Date(); // Same as start date by default
  remarques: string = '';

  // For form binding - updated defaults
  startDateString: string = this.formatDate(new Date());
  endDateString: string = this.formatDate(new Date()); // Same date by default

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
  
  // Past date confirmation modal
  showPastDateModal = false;
  showSuccessModal = false;
  pendingReservationRequest: CreateReservationRequest | null = null;

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private clientService: ClientService,
    private categoryService: CategoryService,
    private reservationService: ReservationService,
    private toastr: ToastrService // Inject ToastrService
  ) { }

  ngOnInit(): void {
    // Read the 'date' parameter from the URL
    this.route.queryParams.subscribe(params => {
      const dateParam = params['date'];
      console.log('Date parameter from URL:', dateParam);
      
      if (dateParam) {
        // Validate the date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(dateParam)) {
          const paramDate = new Date(dateParam);
          
          if (!isNaN(paramDate.getTime())) {
            this.startDateString = dateParam;
            this.startDate = paramDate;
            
            // Set end date to same as start date (1 day rental by default)
            this.endDateString = dateParam;
            this.endDate = paramDate;
            
            console.log('Start date set to:', this.startDateString);
            console.log('End date set to:', this.endDateString);
            
            this.onDateChange();
          } else {
            console.warn('Invalid date parameter:', dateParam);
            this.setDefaultDates();
          }
        } else {
          console.warn('Invalid date format in URL parameter (expected YYYY-MM-DD):', dateParam);
          this.setDefaultDates();
        }
      } else {
        console.log('No date parameter found, using default dates');
        this.setDefaultDates();
      }
    });

    // Initialize your other data (clients, articles, categories, etc.)
    this.loadData();
  }

  private setDefaultDates(): void {
    const today = new Date();
    
    this.startDate = today;
    this.endDate = today; // Default to same day (1 day rental)
    this.startDateString = this.formatDate(today);
    this.endDateString = this.formatDate(today);
    
    console.log('Default dates set - Start:', this.startDateString, 'End:', this.endDateString);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private parseDate(dateString: string): Date {
    return new Date(dateString);
  }

  calculateDays(): number {
    if (!this.startDateString || !this.endDateString) return 1;
    
    const start = this.parseDate(this.startDateString);
    const end = this.parseDate(this.endDateString);
    
    // For rental duration calculation:
    // Same date (start = end) = 1 day rental
    // Different dates = (end - start) + 1 days
    if (start.getTime() === end.getTime()) {
      return 1; // Same day rental = 1 day
    }
    
    // Calculate the difference in days
    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // Add 1 to include both start and end dates in the rental period
    return Math.max(1, Math.floor(diffDays) + 1);
  }

  onDateChange(): void {
    // Update Date objects when string values change
    if (this.startDateString) {
      this.startDate = this.parseDate(this.startDateString);
    }
    if (this.endDateString) {
      this.endDate = this.parseDate(this.endDateString);
    }

    // If end date is before start date, set it to start date (1 day rental)
    if (this.startDateString && this.endDateString) {
      const start = this.parseDate(this.startDateString);
      const end = this.parseDate(this.endDateString);

      if (end < start) {
        this.endDateString = this.startDateString;
        this.endDate = new Date(start);
      }
    }
  }

  getTodayFormatted(): string {
    return this.formatDate(new Date());
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

  // Quantity control methods
  decreaseQuantity(article: ArticleWithTemp): void {
    if (article.tempQuantity > 1) {
      article.tempQuantity--;
    }
  }

  increaseQuantity(article: ArticleWithTemp): void {
    if (article.tempQuantity < article.quantityTotal) {
      article.tempQuantity++;
    }
  }

  onQuantityInput(article: ArticleWithTemp, event: any): void {
    const value = parseInt(event.target.value);

    // Allow empty input for better UX while typing
    if (event.target.value === '' || isNaN(value)) {
      return;
    }

    // Real-time validation
    if (value < 1) {
      article.tempQuantity = 1;
    } else if (value > article.quantityTotal) {
      article.tempQuantity = article.quantityTotal;
    } else {
      article.tempQuantity = value;
    }
  }

  validateQuantity(article: ArticleWithTemp): void {
    // Ensure valid quantity on blur (when user leaves the input)
    if (!article.tempQuantity || article.tempQuantity < 1) {
      article.tempQuantity = 1;
    } else if (article.tempQuantity > article.quantityTotal) {
      article.tempQuantity = article.quantityTotal;
    }

    // Ensure it's an integer
    article.tempQuantity = Math.floor(article.tempQuantity);
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
    const startDate = this.parseDate(this.startDateString);
    const endDate = this.parseDate(this.endDateString);

    if (!this.selectedClientId || !startDate || !endDate) {
      this.error = 'Veuillez remplir tous les champs obligatoires';
      this.toastr.error('Veuillez remplir tous les champs obligatoires'); // Add toaster for validation error
      return;
    }

    if (this.reservationItems.length === 0) {
      this.error = 'Veuillez sélectionner au moins un article';
      this.toastr.warning('Veuillez sélectionner au moins un article'); // Add toaster for empty items
      return;
    }

    const reservationRequest: CreateReservationRequest = {
      clientId: this.selectedClientId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      remarques: this.remarques,
      reservationItems: this.reservationItems.map(item => ({
        articleId: item.articleId,
        quantity: item.quantity
      }))
    };

    // Check if start date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
    
    if (startDate < today) {
      // Store the request and show confirmation modal
      this.pendingReservationRequest = reservationRequest;
      this.showPastDateModal = true;
      return;
    }

    // If date is not in the past, proceed with creation
    this.createReservation(reservationRequest);
  }

  // Method to handle the actual reservation creation
  private createReservation(reservationRequest: CreateReservationRequest): void {
    this.submitting = true;
    this.error = null;

    this.reservationService.createReservation(reservationRequest).subscribe({
      next: (createdReservation) => {
        this.submitting = false;
        console.log('Reservation created successfully:', createdReservation);
        
        // Show success modal instead of toaster
        this.showSuccessModal = true;
        
        this.reservationCreated.emit(createdReservation);
      },
      error: (err) => {
        this.submitting = false;
        console.error('Full error object:', err);

        let errorMessage = 'Une erreur est survenue lors de la création de la réservation.';
        if (err.error && typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.error && Array.isArray(err.error.errors)) {
          errorMessage = err.error.errors.map((e: any) => e.message || e).join(', ');
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        // Set component error property
        this.error = errorMessage;
        
        // Show error toaster
        this.toastr.error(errorMessage, 'Erreur');
      }
    });
  }
  
  // Method to close the success modal
  closeSuccessModal(): void {
    this.showSuccessModal = false;
    // Call onCancel() to reinitialize the form
    this.onCancel();
  }

  onCancel(): void {
    // Clear all selected items
    this.reservationItems = [];
  
    // Optionally clear other form fields
    this.selectedClientId = null;
    this.startDateString = '';
    this.endDateString = '';
    this.remarques = '';
    this.error = null;
  
    // Also close the drawer if it's open
    this.isDrawerOpen = false;
    
    // Reset past date modal state
    this.showPastDateModal = false;
    this.pendingReservationRequest = null;
  }
  
  // Methods for past date confirmation modal
  confirmPastDateReservation(): void {
    if (this.pendingReservationRequest) {
      // Proceed with reservation creation despite past date
      this.createReservation(this.pendingReservationRequest);
      
      // Close the modal
      this.showPastDateModal = false;
      this.pendingReservationRequest = null;
    }
  }
  
  cancelPastDateReservation(): void {
    // Just close the modal without creating the reservation
    this.showPastDateModal = false;
    this.pendingReservationRequest = null;
    
    // Reset submitting state if it was set
    this.submitting = false;
  }
}