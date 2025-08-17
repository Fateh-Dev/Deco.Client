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
export class CalendarComponent 
 implements OnInit {
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

    Promise.all([
      this.reservationService.getReservations().toPromise(),
      this.clientService.getClients().toPromise()
    ]).then(([reservations, clients]) => {
      this.reservations = reservations || [];
      this.clients = clients || [];
      this.generateCalendar(new Date());
      this.loading = false;
    }).catch(error => {
      console.error('Error loading data:', error);
      this.error = 'Erreur lors du chargement des données';
      this.loading = false;
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
    return date >= startDate && date <= endDate;
  });
}

calculateDayRevenue(reservations: Reservation[]): number {
  return reservations.reduce((total, reservation) => {
    if (reservation.status !== ReservationStatus.Annulee) {
      const startDate = new Date(reservation.startDate);
      const endDate = new Date(reservation.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
  const prevMonth = new Date(this.currentMonth.year, this.currentMonth.month - 1, 1);
  this.generateCalendar(prevMonth);
}

goToNextMonth(): void {
  const nextMonth = new Date(this.currentMonth.year, this.currentMonth.month + 1, 1);
  this.generateCalendar(nextMonth);
}

goToToday(): void {
  this.generateCalendar(new Date());
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

viewReservation(reservation: Reservation, event ?: Event): void {
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

addReservation(date: Date, event ?: Event): void {
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
    'en_attente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'confirmée': 'bg-green-100 text-green-800 border-green-200',
    'annulée': 'bg-red-100 text-red-800 border-red-200',
    'terminée': 'bg-blue-100 text-blue-800 border-blue-200'
  };
  return classes[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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
  const monthReservations = this.reservations.filter(reservation => {
    const reservationDate = new Date(reservation.createdAt);
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
      const date = new Date(r.createdAt);
      return date.getMonth() === this.currentMonth.month &&
        date.getFullYear() === this.currentMonth.year;
    })
  };

  console.log('Exporting calendar data:', exportData);
  alert(`📅 Export du calendrier ${this.currentMonth.monthName
} ${ this.currentMonth.year } \n\nDonnées préparées pour l'export. Fonctionnalité en cours de développement.`);
  }

generateMonthlyReport(): void {
  const stats = this.getMonthlyStats();
  alert(`📊 Rapport ${this.currentMonth.monthName
} ${ this.currentMonth.year }:

📅 Total réservations: ${ stats.totalReservations }
💰 Revenus totaux: ${ stats.totalRevenue.toLocaleString() } DZD
📆 Jours occupés: ${ stats.occupiedDays }
📈 Taux d'occupation: ${stats.occupancyRate}%

📋 Détails disponibles dans l'export complet.`);
  }

refreshCalendar(): void {
  this.loadData();
}

// Track by functions for performance
trackByDate(index: number, day: CalendarDay): string {
  return day.date.toISOString();
}

trackByReservation(index: number, reservation: Reservation): number {
  return reservation.id ?? -1; // or any other default number
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