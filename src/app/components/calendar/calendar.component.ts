import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { ClientService } from '../../services/client.service';
import { ArticleService } from '../../services/article.service';
import { Reservation, ReservationStatus } from '../../models/reservation';

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  reservations: Reservation[];
  hasReservations: boolean;
  revenue: number;
}

interface MonthData {
  year: number;
  month: number;
  monthName: string;
  days: CalendarDay[];
}

interface MonthlyStats {
  totalReservations: number;
  totalRevenue: number;
  occupiedDays: number;
  occupancyRate: number;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
}) 
export class CalendarComponent implements OnInit {
  currentMonth!: MonthData;
  reservations: Reservation[] = [];
  clients: any[] = [];
  loading = true;
  error = '';
  selectedReservation: Reservation | null = null;
  selectedDay: CalendarDay | null = null;
  showDayModal = false;

  weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  constructor(
    private reservationService: ReservationService,
    private clientService: ClientService,
    private articleService: ArticleService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1; // API expects 1-based month

    console.log('Loading calendar data for:', year, month);

    // Use the new calendar API directly
    this.reservationService.getCalendarData(year, month).subscribe({
      next: (data) => {
        console.log('Calendar data received:', data);
        
        // Load clients for display names
        this.clientService.getClients().subscribe({
          next: (clients) => {
            this.clients = clients || [];
            // Use API data directly instead of generating calendar
            this.mapApiDataToCalendar(data);
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading clients:', error);
            this.clients = [];
            this.mapApiDataToCalendar(data);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading calendar data:', error);
        this.error = 'Erreur lors du chargement des données du calendrier';
        this.loading = false;
        // Fallback to old method if API fails
        this.loadDataFallback();
      }
    });
  }

  mapApiDataToCalendar(apiData: any): void {
    console.log('Mapping API data to calendar:', apiData);
    
    // Convert API response to our calendar format
    const days: CalendarDay[] = apiData.days.map((dayData: any) => {
      const date = new Date(dayData.date);
      const reservations: Reservation[] = dayData.reservations.map((r: any) => ({
        id: r.id,
        clientId: r.clientId,
        startDate: r.startDate,
        endDate: r.endDate,
        totalPrice: r.totalPrice,
        status: r.status,
        createdAt: r.startDate
      }));

      return {
        date: date,
        day: dayData.day,
        isCurrentMonth: dayData.isCurrentMonth,
        isToday: dayData.isToday,
        isWeekend: dayData.isWeekend,
        reservations: reservations,
        hasReservations: dayData.hasReservations,
        revenue: dayData.revenue || 0
      };
    });

    // Also get all reservations for stats calculations
    this.reservations = apiData.days.flatMap((day: any) => 
      day.reservations.map((r: any) => ({
        id: r.id,
        clientId: r.clientId,
        startDate: r.startDate,
        endDate: r.endDate,
        totalPrice: r.totalPrice,
        status: r.status,
        createdAt: r.startDate
      }))
    );

    this.currentMonth = {
      year: apiData.year,
      month: apiData.month - 1, // Convert from 1-based to 0-based for JS
      monthName: apiData.monthName,
      days: days
    };

    console.log('Calendar mapped successfully:', this.currentMonth);
  }

  loadDataFallback(): void {
    console.log('Using fallback method...');
    this.reservationService.getReservations().subscribe({
      next: (reservations) => {
        this.clientService.getClients().subscribe({
          next: (clients) => {
            console.log('Fallback data loaded:', { reservations: reservations?.length, clients: clients?.length });
            this.reservations = reservations || [];
            this.clients = clients || [];
            this.generateCalendar(new Date());
            this.loading = false;
            this.error = ''; // Clear error when fallback succeeds
          },
          error: (error) => {
            console.error('Error loading clients:', error);
            this.reservations = reservations || [];
            this.clients = [];
            this.generateCalendar(new Date());
            this.loading = false;
            this.error = 'Erreur lors du chargement des clients';
          }
        });
      },
      error: (error) => {
        console.error('Error loading reservations:', error);
        this.error = 'Erreur lors du chargement des réservations';
        this.loading = false;
      }
    });
  }

  loadMonthData(year: number, month: number): void {
    this.loading = true;
    this.error = '';

    // month is 0-based from JS Date, but API expects 1-based
    this.reservationService.getCalendarData(year, month + 1).subscribe({
      next: (data) => {
        console.log('Month data received:', data);
        
        this.clientService.getClients().subscribe({
          next: (clients) => {
            this.clients = clients || [];
            this.mapApiDataToCalendar(data);
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading clients:', error);
            this.clients = [];
            this.mapApiDataToCalendar(data);
            this.loading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading month data:', error);
        this.error = 'Erreur lors du chargement des données du mois';
        this.loading = false;
      }
    });
  }

  generateCalendar(date: Date): void {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);

    // Generate 42 days (6 weeks)
    for(let i = 0; i < 42; i++) {
      const dayReservations = this.getReservationsForDate(currentDate);
      const dayRevenue = this.calculateDayRevenue(dayReservations);

      days.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: this.isSameDay(currentDate, today),
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
        reservations: dayReservations,
        hasReservations: dayReservations.length > 0,
        revenue: dayRevenue
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.currentMonth = {
      year,
      month,
      monthName: this.monthNames[month],
      days
    };
  }

  getReservationsForDate(date: Date): Reservation[] {
    return this.reservations.filter(reservation => {
      const startDate = new Date(reservation.startDate);
      const endDate = new Date(reservation.endDate);
      
      // Set times to start of day for accurate comparison
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const resStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const resEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      return checkDate >= resStart && checkDate <= resEnd;
    });
  }

  calculateDayRevenue(reservations: Reservation[]): number {
    return reservations.reduce((total, reservation) => {
      if (reservation.status !== ReservationStatus.Annulee) {
        const startDate = new Date(reservation.startDate);
        const endDate = new Date(reservation.endDate);
        const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        return total + (reservation.totalPrice / days);
      }
      return total;
    }, 0);
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear();
  }

  // Navigation methods
  goToPreviousMonth(): void {
    const prevYear = this.currentMonth.month === 0 ? this.currentMonth.year - 1 : this.currentMonth.year;
    const prevMonth = this.currentMonth.month === 0 ? 11 : this.currentMonth.month - 1;
    this.loadMonthData(prevYear, prevMonth);
  }

  goToNextMonth(): void {
    const nextYear = this.currentMonth.month === 11 ? this.currentMonth.year + 1 : this.currentMonth.year;
    const nextMonth = this.currentMonth.month === 11 ? 0 : this.currentMonth.month + 1;
    this.loadMonthData(nextYear, nextMonth);
  }

  goToToday(): void {
    const today = new Date();
    this.loadMonthData(today.getFullYear(), today.getMonth());
  }

  // Event handlers
  selectDay(day: CalendarDay): void {
    if(day.hasReservations) {
      this.selectedDay = day;
      this.showDayModal = true;
    }
  }

  closeDayModal(): void {
    this.showDayModal = false;
    this.selectedDay = null;
  }

  viewReservation(reservation: Reservation, event?: Event): void {
    if(event) {
      event.stopPropagation();
    }
    this.selectedReservation = reservation;
  }

  closeReservationModal(): void {
    this.selectedReservation = null;
  }

  editReservation(reservation: Reservation): void {
    this.closeReservationModal();
    this.router.navigate(['/reservations', reservation.id, 'edit']);
  }

  addReservation(date: Date, event?: Event): void {
    if(event) {
      event.stopPropagation();
    }
    this.router.navigate(['/reservations/new'], {
      queryParams: { date: date.toISOString().split('T')[0] }
    });
  }

  // Utility methods
  getClientName(clientId: number): string {
    const client = this.clients.find(c => c.id === clientId);
    return client ? client.name : 'Client inconnu';
  }

  getReservationStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'EnAttente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      '0': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Confirmee': 'bg-green-100 text-green-800 border-green-200', 
      '1': 'bg-green-100 text-green-800 border-green-200',
      'Annulee': 'bg-red-100 text-red-800 border-red-200',
      '2': 'bg-red-100 text-red-800 border-red-200',
      'Terminee': 'bg-blue-100 text-blue-800 border-blue-200',
      '3': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return classes[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'EnAttente': 'bg-yellow-100 text-yellow-800',
      '0': 'bg-yellow-100 text-yellow-800',
      'Confirmee': 'bg-green-100 text-green-800',
      '1': 'bg-green-100 text-green-800',
      'Annulee': 'bg-red-100 text-red-800',
      '2': 'bg-red-100 text-red-800',
      'Terminee': 'bg-blue-100 text-blue-800',
      '3': 'bg-blue-100 text-blue-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'EnAttente': 'En attente',
      '0': 'En attente',
      'Confirmee': 'Confirmée',
      '1': 'Confirmée',
      'Annulee': 'Annulée',
      '2': 'Annulée',
      'Terminee': 'Terminée',
      '3': 'Terminée'
    };
    return labels[status] || status;
  }

  getReservationTooltip(reservation: Reservation): string {
    const client = this.getClientName(reservation.clientId);
    const price = reservation.totalPrice;
    const startDate = new Date(reservation.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(reservation.endDate).toLocaleDateString('fr-FR');
    return `${client} - ${price} DZD (${startDate} - ${endDate})`;
  }

  getRevenueBadgeClass(revenue: number): string {
    if (revenue === 0) return 'hidden';
    if (revenue < 1000) return 'bg-green-100 text-green-800';
    if (revenue < 5000) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  // Statistics methods
  getMonthlyStats(): MonthlyStats {
    if (!this.currentMonth || !this.currentMonth.days) {
      return {
        totalReservations: 0,
        totalRevenue: 0,
        occupiedDays: 0,
        occupancyRate: 0
      };
    }

    const monthReservations = this.reservations.filter(reservation => {
      const reservationDate = new Date(reservation.startDate);
      return reservationDate.getMonth() === this.currentMonth.month &&
        reservationDate.getFullYear() === this.currentMonth.year;
    });

    const totalRevenue = monthReservations
      .filter(r => r.status !== ReservationStatus.Annulee)
      .reduce((sum, r) => sum + r.totalPrice, 0);

    const occupiedDaysSet = new Set<string>();
    monthReservations
      .filter(r => r.status !== ReservationStatus.Annulee)
      .forEach(r => {
        const start = new Date(r.startDate);
        const end = new Date(r.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (d.getMonth() === this.currentMonth.month && d.getFullYear() === this.currentMonth.year) {
            occupiedDaysSet.add(d.getDate().toString());
          }
        }
      });

    const occupiedDays = occupiedDaysSet.size;
    const totalDaysInMonth = new Date(this.currentMonth.year, this.currentMonth.month + 1, 0).getDate();
    const occupancyRate = totalDaysInMonth > 0 ? Math.round((occupiedDays / totalDaysInMonth) * 100) : 0;

    return {
      totalReservations: monthReservations.length,
      totalRevenue,
      occupiedDays,
      occupancyRate
    };
  }

  getUpcomingReservations(): Reservation[] {
    const today = new Date();
    return this.reservations
      .filter(r => new Date(r.startDate) >= today && r.status !== ReservationStatus.Annulee)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5);
  }

  getDayReservationsCount(day: CalendarDay): number {
    return day.reservations.length;
  }

  // Navigation and actions
  navigateToNewReservation(): void {
    this.router.navigate(['/reservations/new']);
  }

  navigateToReservations(): void {
    this.router.navigate(['/reservations']);
  }

  navigateToClients(): void {
    this.router.navigate(['/clients']);
  }

  exportCalendar(): void {
    const monthStats = this.getMonthlyStats();
    const exportData = {
      month: `${this.currentMonth.monthName} ${this.currentMonth.year}`,
      stats: monthStats,
      reservations: this.reservations.filter(r => {
        const date = new Date(r.startDate);
        return date.getMonth() === this.currentMonth.month &&
          date.getFullYear() === this.currentMonth.year;
      })
    };

    console.log('Exporting calendar data:', exportData);
    alert(`📅 Export du calendrier ${this.currentMonth.monthName} ${this.currentMonth.year}\n\nDonnées préparées pour l'export. Fonctionnalité en cours de développement.`);
  }

  generateMonthlyReport(): void {
    const stats = this.getMonthlyStats();
    alert(`📊 Rapport ${this.currentMonth.monthName} ${this.currentMonth.year}:\n\n📅 Total réservations: ${stats.totalReservations}\n💰 Revenus totaux: ${stats.totalRevenue.toLocaleString()} DZD\n📆 Jours occupés: ${stats.occupiedDays}\n📈 Taux d'occupation: ${stats.occupancyRate}%\n\n📋 Détails disponibles dans l'export complet.`);
  }

  refreshCalendar(): void {
    if (this.currentMonth) {
      this.loadMonthData(this.currentMonth.year, this.currentMonth.month);
    } else {
      this.loadData();
    }
  }

  // Track by functions for performance
  trackByDate(index: number, day: CalendarDay): string {
    return day.date.toISOString();
  }

  trackByReservation(index: number, reservation: Reservation): number {
    return reservation.id ?? -1;
  }

  // Helper methods for template
  getVisibleReservations(day: CalendarDay): Reservation[] {
    return day.reservations.slice(0, 2);
  }

  getHiddenReservationsCount(day: CalendarDay): number {
    return Math.max(0, day.reservations.length - 2);
  }

  hasHiddenReservations(day: CalendarDay): boolean {
    return day.reservations.length > 2;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatShortDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  }
}