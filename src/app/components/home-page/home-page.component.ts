import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { ReservationService } from '../../services/reservation.service';
// UserService is no longer needed as we're using ClientService now
import { ClientService } from '../../services/client.service';
import { Article } from '../../models/article';
import { Reservation, ReservationStatus } from '../../models/reservation';
import { User } from '../../models/user';

// Add Font Awesome CSS in index.html:
// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  articles: Article[] = [];
  reservations: Reservation[] = [];
  // Using Client instead of User to match our updated model
  clients: any[] = [];
  
  // Dashboard statistics
  totalArticles = 0;
  totalReservations = 0;
  totalClients = 0;
  totalStock = 0;
  
  // Loading states
  loading = true;
  error = '';

  // Category mapping for better UI
  private categoryNames: { [key: number]: string } = {
    1: 'Chaises',
    2: 'Tables',
    3: 'Décorations florales',
    4: 'Éclairage',
    5: 'Miroirs',
    6: 'Linge de table'
  };

  // Category icons mapping using Font Awesome classes
  private categoryIcons: { [key: number]: string } = {
    1: 'fa-chair',
    2: 'fa-table',
    3: 'fa-seedling',
    4: 'fa-lightbulb',
    5: 'fa-mirror',
    6: 'fa-tshirt'
  };

  constructor(
    private articleService: ArticleService,
    private reservationService: ReservationService,
    private clientService: ClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    // Load articles
    this.articleService.getArticles().subscribe({
      next: (articles) => {
        this.articles = articles;
        this.totalArticles = articles.length;
        this.totalStock = articles.reduce((sum, article) => sum + article.quantityTotal, 0);
      },
      error: (error: any) => {
        console.error('Error loading articles:', error);
        this.error = 'Erreur lors du chargement des articles';
      }
    });

    // Load reservations
    this.reservationService.getReservations().subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.totalReservations = reservations.length;
      },
      error: (error: any) => {
        console.error('Error loading reservations:', error);
        this.error = 'Erreur lors du chargement des réservations';
      }
    });

    // Load clients
    this.clientService.getClients().subscribe({
      next: (clients: any[]) => {
        this.clients = clients;
        this.totalClients = clients.length;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading clients:', error);
        this.error = 'Erreur lors du chargement des clients';
        this.loading = false;
      }
    });
  }

  // Data helper methods
  getRecentArticles(): Article[] {
    return this.articles
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  getRecentReservations(): Reservation[] {
    return this.reservations
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  getActiveReservations(): number {
    return this.reservations.filter(r => 
      r.status === ReservationStatus.Confirmee && 
      new Date(r.endDate) >= new Date()
    ).length;
  }

  getNewClientsThisMonth(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return this.clients.filter((client: any) => {
      const createdDate = new Date(client.createdAt);
      return createdDate.getMonth() === currentMonth && 
             createdDate.getFullYear() === currentYear;
    }).length;
  }

  getMonthlyRevenue(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return this.reservations
      .filter(reservation => {
        const reservationDate = new Date(reservation?.createdAt);
        return reservationDate.getMonth() === currentMonth &&
               reservationDate.getFullYear() === currentYear &&
               reservation?.status !== ReservationStatus.Annulee;
      })
      .reduce((sum, reservation) => sum + reservation?.totalPrice, 0);
  }

  getRevenueGrowth(): string {
    const currentMonthRevenue = this.getMonthlyRevenue();
    const lastMonthRevenue = this.getLastMonthRevenue();
    
    if (lastMonthRevenue === 0) return '+100';
    
    const growth = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    return growth > 0 ? `+${growth.toFixed(1)}` : growth.toFixed(1);
  }

  private getLastMonthRevenue(): number {
    const lastMonth = new Date().getMonth() - 1;
    const year = lastMonth < 0 ? new Date().getFullYear() - 1 : new Date().getFullYear();
    const month = lastMonth < 0 ? 11 : lastMonth;
    
    return this.reservations
      .filter(reservation => {
        const reservationDate = new Date(reservation?.createdAt);
        return reservationDate.getMonth() === month &&
               reservationDate.getFullYear() === year &&
               reservation?.status !== ReservationStatus.Annulee;
      })
      .reduce((sum, reservation) => sum + reservation?.totalPrice, 0);
  }

  // UI helper methods
  getCategoryName(categoryId: number): string {
    return this.categoryNames[categoryId] || 'Catégorie inconnue';
  }

  getArticleIcon(categoryId: number): string {
    return this.categoryIcons[categoryId] || 'fa-tag';
  }

  getUserName(clientId: number): string {
    const client = this.clients.find(c => c.id === clientId);
    return client ? client.name : 'Client inconnu';
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'en_attente': 'bg-yellow-100 text-yellow-800',
      'confirmée': 'bg-green-100 text-green-800',
      'annulée': 'bg-red-100 text-red-800',
      'terminée': 'bg-blue-100 text-blue-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'en_attente': 'En attente',
      'confirmée': 'Confirmée',
      'annulée': 'Annulée',
      'terminée': 'Terminée'
    };
    return labels[status] || status;
  }

  // Navigation methods
  navigateToArticles(): void {
    this.router.navigate(['/articles']);
  }

  navigateToReservations(): void {
    this.router.navigate(['/reservations']);
  }

  navigateToClients(): void {
    this.router.navigate(['/clients']);
  }

  navigateToNewReservation(): void {
    this.router.navigate(['/reservations/new']);
  }

  navigateToAddArticle(): void {
    this.router.navigate(['/articles/new']);
  }

  navigateToAddUser(): void {
    this.router.navigate(['/users/new']);
  }

  // Action methods
  generateReport(): void {
    // Implement report generation logic
    const reportData = {
      totalArticles: this.totalArticles,
      totalStock: this.totalStock,
      totalReservations: this.totalReservations,
      activeReservations: this.getActiveReservations(),
      totalClients: this.totalClients,
      newClientsThisMonth: this.getNewClientsThisMonth(),
      monthlyRevenue: this.getMonthlyRevenue(),
      revenueGrowth: this.getRevenueGrowth()
    };

    // Here you could:
    // 1. Navigate to a report page
    // 2. Download a PDF
    // 3. Show a modal with the report
    // 4. Send to a service for processing
    
    console.log('Generating report with data:', reportData);
    
    // For now, show an alert with basic info
    alert(`📊 Rapport rapide:
    
📦 Articles: ${this.totalArticles} (${this.totalStock} unités)
📅 Réservations: ${this.totalReservations} (${this.getActiveReservations()} actives)
👥 Clients: ${this.totalClients} (${this.getNewClientsThisMonth()} nouveaux ce mois)
💰 Revenus ce mois: ${this.getMonthlyRevenue()} DZD (${this.getRevenueGrowth()}%)`);
  }

  // Refresh data
  refreshDashboard(): void {
    this.loadDashboardData();
  }

  // Get most popular category
  getMostPopularCategory(): string {
    const categoryCount: { [key: number]: number } = {};
    
    this.reservations.forEach(reservation => {
      // Assuming reservation has items with article references
      // You might need to adjust this based on your ReservationItem model
      if (reservation.reservationItems) {
        reservation.reservationItems.forEach((item: any) => {
          const article = this.articles.find(a => a.id === item.articleId);
          if (article) {
            categoryCount[article.categoryId] = (categoryCount[article.categoryId] || 0) + item.quantity;
          }
        });
      }
    });

    const mostPopularCategoryId = Object.keys(categoryCount)
      .reduce((a, b) => categoryCount[Number(a)] > categoryCount[Number(b)] ? a : b);

    return this.getCategoryName(Number(mostPopularCategoryId));
  }

  // Calculate availability rate
  getAvailabilityRate(): number {
    if (this.articles.length === 0) return 0;
    
    const totalCapacity = this.articles.reduce((sum, article) => sum + article.quantityTotal, 0);
    const currentlyRented = this.getCurrentlyRentedItems();
    
    return Math.round(((totalCapacity - currentlyRented) / totalCapacity) * 100);
  }

  private getCurrentlyRentedItems(): number {
    const today = new Date();
    let rentedCount = 0;

    this.reservations.forEach(reservation => {
      if (reservation.status === ReservationStatus.Confirmee && 
          new Date(reservation.startDate) <= today && 
          new Date(reservation.endDate) >= today) {
        
        if (reservation?.reservationItems) {
          reservation.reservationItems.forEach((item: any) => {
            rentedCount += item.quantity;
          });
        }
      }
    });

    return rentedCount;
  }
}