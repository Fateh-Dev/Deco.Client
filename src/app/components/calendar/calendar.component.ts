import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { ClientService } from '../../services/client.service';
import { ArticleService } from '../../services/article.service';
import { Reservation, ReservationStatus } from '../../models/reservation';
import { ReservationDetailDialogComponent } from '../reservations/reservation-detail-dialog/reservation-detail-dialog.component';

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
  imports: [CommonModule, RouterModule, ReservationDetailDialogComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
}) 
export class CalendarComponent implements OnInit {
  currentMonth!: MonthData;
  reservations: Reservation[] = [];
  clients: any[] = [];
  loading = true;
  error = '';
  selectedDay: CalendarDay | null = null;
  showDayModal = false;

  // Detail dialog properties
  showDetailDialog: boolean = false;
  selectedReservationId: number | null = null;

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
    this.loadMonthData(today.getFullYear(), today.getMonth());
  }

  // Utility method to create a complete Reservation object from API data
  private createReservationFromApiData(apiReservation: any): Reservation {
    return {
      id: apiReservation.id,
      clientId: apiReservation.clientId,
      startDate: apiReservation.startDate,
      endDate: apiReservation.endDate,
      totalPrice: apiReservation.totalPrice,
      status: apiReservation.status,
      createdAt: apiReservation.createdAt || apiReservation.startDate || new Date().toISOString(),
      isActive: apiReservation.isActive !== undefined ? apiReservation.isActive : true,
      reservationItems: apiReservation.reservationItems || []
    };
  }

  generateCalendarFromReservations(year: number, month: number): void {
    const today = new Date();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const days: CalendarDay[] = [];
    
    // Calculate how many days we need to show from previous month
    // We want to show empty/disabled cells to align the calendar properly
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevMonthDate = new Date(year, month, -i);
      days.push({
        date: prevMonthDate,
        day: prevMonthDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isWeekend: prevMonthDate.getDay() === 0 || prevMonthDate.getDay() === 6,
        reservations: [],
        hasReservations: false,
        revenue: 0
      });
    }
    
    // Add all days of the current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      const dayReservations = this.getReservationsForDate(currentDate);
      const dayRevenue = this.calculateDayRevenue(dayReservations);
      const isToday = this.isSameDay(currentDate, today);
      
      days.push({
        date: new Date(currentDate),
        day: day,
        isCurrentMonth: true,
        isToday: isToday,
        isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
        reservations: dayReservations,
        hasReservations: dayReservations.length > 0,
        revenue: dayRevenue
      });
    }
    
    // Add days from next month to complete the last week if needed
    const totalCells = days.length;
    const remainingCells = totalCells % 7;
    if (remainingCells > 0) {
      const cellsToAdd = 7 - remainingCells;
      for (let i = 1; i <= cellsToAdd; i++) {
        const nextMonthDate = new Date(year, month + 1, i);
        days.push({
          date: nextMonthDate,
          day: i,
          isCurrentMonth: false,
          isToday: false,
          isWeekend: nextMonthDate.getDay() === 0 || nextMonthDate.getDay() === 6,
          reservations: [],
          hasReservations: false,
          revenue: 0
        });
      }
    }
    
    this.currentMonth = {
      year: year,
      month: month,
      monthName: this.monthNames[month],
      days: days
    };
    
    console.log('Calendar generated:', {
      month: this.monthNames[month],
      year: year,
      totalDays: days.length,
      currentMonthDays: days.filter(d => d.isCurrentMonth).length,
      firstDay: days.find(d => d.isCurrentMonth)?.date,
      lastDay: days.filter(d => d.isCurrentMonth).pop()?.date
    });
  }

  // Keep the existing generateCalendar method as fallback but fix it
  generateCalendar(date: Date): void {
    const year = date.getFullYear();
    const month = date.getMonth();
    this.generateCalendarFromReservations(year, month);
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
    const prevMonth = this.currentMonth.month === 0 ? 11 : this.currentMonth.month - 1;
    const prevYear = this.currentMonth.month === 0 ? this.currentMonth.year - 1 : this.currentMonth.year;
    this.loadMonthData(prevYear, prevMonth);
  }

  goToNextMonth(): void {
    const nextMonth = this.currentMonth.month === 11 ? 0 : this.currentMonth.month + 1;
    const nextYear = this.currentMonth.month === 11 ? this.currentMonth.year + 1 : this.currentMonth.year;
    this.loadMonthData(nextYear, nextMonth);
  }

  goToToday(): void {
    const today = new Date();
    this.loadMonthData(today.getFullYear(), today.getMonth());
  }

  // Event handlers
  selectDay(day: CalendarDay): void {
    if (!day.isCurrentMonth) {
      return; // Don't do anything for non-current month days
    }
    
    if (day.hasReservations) {
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
    this.openReservationDetail(reservation.id!);
  }

  // Detail dialog methods
  openReservationDetail(reservationId: number): void {
    this.selectedReservationId = reservationId;
    this.showDetailDialog = true;
  }

  closeReservationDetail(): void {
    this.showDetailDialog = false;
    this.selectedReservationId = null;
  }

  editReservation(reservation: Reservation): void {
    this.closeReservationDetail();
    this.router.navigate(['/reservations', reservation.id, 'edit']);
  }

  addReservation(date: Date, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    
    const dayData = this.currentMonth.days.find(d => 
      d.date.getDate() === date.getDate() && 
      d.date.getMonth() === date.getMonth() && 
      d.date.getFullYear() === date.getFullYear()
    );
    
    if (!dayData || !dayData.isCurrentMonth) {
      return;
    }

    // Format date to YYYY-MM-DD without timezone conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // Use route parameter instead of query parameter
    this.router.navigate(['/reservations/new', dateString]);
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
    alert(`🗓️ Export du calendrier ${this.currentMonth.monthName} ${this.currentMonth.year}\n\nDonnées préparées pour l'export. Fonctionnalité en cours de développement.`);
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

  //************************** */

  // Fixed sections of calendar.component.ts

  mapApiDataToCalendar(apiData: any, year: number, month: number): void {
    console.log('Mapping API data for:', year, month + 1);
    
    // Extract reservations from API data with deduplication
    const reservationMap = new Map<number, Reservation>();
    
    if (apiData.days && Array.isArray(apiData.days)) {
      apiData.days.forEach((day: any) => {
        if (day.reservations && Array.isArray(day.reservations)) {
          day.reservations.forEach((r: any) => {
            // Use reservation ID as key to prevent duplicates
            if (!reservationMap.has(r.id)) {
              reservationMap.set(r.id, this.createReservationFromApiData(r));
            }
          });
        }
      });
    }
    
    // Convert map values to array
    this.reservations = Array.from(reservationMap.values());
    
    // Generate calendar manually with the deduplicated reservation data
    this.generateCalendarFromReservations(year, month);
  }

  // Alternative fix - if API returns reservations directly
  loadMonthData(year: number, month: number): void {
    this.loading = true;
    this.error = '';

    // Load clients first
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients || [];
        
        // Try to use API calendar data, fallback to manual generation
        this.reservationService.getCalendarData(year, month + 1).subscribe({
          next: (data) => {
            console.log('API Calendar data received:', data);
            this.mapApiDataToCalendar(data, year, month);
            this.loading = false;
          },
          error: (error) => {
            console.error('API failed, using fallback:', error);
            // Fallback: load reservations and generate calendar manually
            this.reservationService.getReservations().subscribe({
              next: (reservations) => {
                // Ensure unique reservations by ID
                const uniqueReservations = this.deduplicateReservations(
                  (reservations || []).map(r => this.createReservationFromApiData(r))
                );
                this.reservations = uniqueReservations;
                this.generateCalendarFromReservations(year, month);
                this.loading = false;
              },
              error: (error) => {
                console.error('Error loading reservations:', error);
                this.error = 'Erreur lors du chargement des données';
                this.loading = false;
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.clients = [];
        this.error = 'Erreur lors du chargement des clients';
        this.loading = false;
      }
    });
  }

  // Add this new method to handle deduplication
  private deduplicateReservations(reservations: Reservation[]): Reservation[] {
    const reservationMap = new Map<number, Reservation>();
    
    reservations.forEach(reservation => {
      if (reservation.id && !reservationMap.has(reservation.id)) {
        reservationMap.set(reservation.id, reservation);
      }
    });
    
    return Array.from(reservationMap.values());
  }

  // Enhanced getReservationsForDate method with additional safety
  getReservationsForDate(date: Date): Reservation[] {
    const dateReservations = this.reservations.filter(reservation => {
      const startDate = new Date(reservation.startDate);
      const endDate = new Date(reservation.endDate);
      
      // Set times to start of day for accurate comparison
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const resStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const resEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      return checkDate >= resStart && checkDate <= resEnd;
    });
    
    // Additional deduplication as safety measure
    return this.deduplicateReservations(dateReservations);
  }

  // Enhanced debugging method
  private debugReservations(): void {
    console.log('Total reservations loaded:', this.reservations.length);
    
    // Check for duplicates by ID
    const ids = this.reservations.map(r => r.id);
    const uniqueIds = [...new Set(ids)];
    
    if (ids.length !== uniqueIds.length) {
      console.warn('Duplicate reservation IDs detected!', {
        total: ids.length,
        unique: uniqueIds.length,
        duplicates: ids.filter((id, index) => ids.indexOf(id) !== index)
      });
    }
    
    // Log reservations grouped by date
    const reservationsByDate = new Map<string, Reservation[]>();
    this.reservations.forEach(reservation => {
      const startDate = new Date(reservation.startDate);
      const dateKey = startDate.toDateString();
      
      if (!reservationsByDate.has(dateKey)) {
        reservationsByDate.set(dateKey, []);
      }
      reservationsByDate.get(dateKey)!.push(reservation);
    });
    
    console.log('Reservations by date:', Object.fromEntries(reservationsByDate));
  }
}