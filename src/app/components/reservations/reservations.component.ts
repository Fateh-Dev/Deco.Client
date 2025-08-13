import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ReservationService } from '../../services/reservation.service';
import { Reservation, ReservationStatus } from '../../models/reservation';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user';
import { CreateReservationComponent } from './create-reservation/create-reservation.component';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CreateReservationComponent],
  templateUrl: './reservations.component.html',
  styleUrls: ['./reservations.component.scss']
})
export class ReservationsComponent implements OnInit, OnDestroy {
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  loading = true;
  selectedStatus: string = 'all';
  searchTerm = '';
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems = 0;
  error: string | null = null;
  showCreateModal = false;

  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadReservations();
  }

  onReservationCreated(newReservation: Reservation): void {
    // Add the new reservation to the beginning of the list
    this.reservations = [newReservation, ...this.reservations];
    this.filteredReservations = [newReservation, ...this.filteredReservations];
    this.showCreateModal = false;
    this.totalItems++;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReservations(): void {
    this.loading = true;
    this.error = null;

    this.reservationService.getReservations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservations) => {
          this.reservations = reservations;
          this.filterReservations();
          this.loading = false;

          // If we have reservations, load user data for each reservation
          if (this.reservations.length > 0) {
            this.loadUserDataForReservations();
          }
        },
        error: (error) => {
          console.error('Error loading reservations:', error);
          this.error = 'Erreur lors du chargement des réservations. Veuillez réessayer.';
          this.loading = false;
        }
      });
  }

  /**
   * Loads user data for each reservation
   */
  private loadUserDataForReservations(): void {
    this.reservations.forEach(reservation => {
      if (reservation.userId && !reservation.user) {
        this.userService.getUser(reservation.userId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (user) => {
              reservation.user = user;
              // Update the filtered reservations if needed
              this.filterReservations();
            },
            error: (error) => {
              console.error(`Error loading user data for reservation ${reservation.id}:`, error);
            }
          });
      }
    });
  }

  filterReservations(): void {
    const searchTerm = this.searchTerm?.toLowerCase() || '';

    this.filteredReservations = this.reservations.filter(reservation => {
      // Filter by status
      const statusMatch = this.selectedStatus === 'all' ||
        reservation.status === this.selectedStatus;

      // Filter by search term (search in ID, user name, or user email)
      const searchMatch = !searchTerm ||
        (reservation.id?.toString().includes(searchTerm)) ||
        (reservation.user?.name?.toLowerCase().includes(searchTerm)) ||
        (reservation.user?.email?.toLowerCase().includes(searchTerm));

      return statusMatch && searchMatch;
    });

    this.totalItems = this.filteredReservations.length;
    this.currentPage = 1; // Reset to first page when filters change
  }

  changeStatus(reservationId: number, newStatus: ReservationStatus): void {
    // In a real app, you would call your reservation service here
    // this.reservationService.updateStatus(reservationId, newStatus).subscribe({
    //   next: () => {
    //     this.loadReservations();
    //   },
    //   error: (error) => {
    //     console.error('Error updating status:', error);
    //   }
    // });

    // For demo purposes, update locally
    const reservation = this.reservations.find(r => r.id === reservationId);
    if (reservation) {
      reservation.status = newStatus;
      this.filterReservations();
    }
  }

  getStatusClass(status: ReservationStatus): string {
    // This returns the CSS class for the status badge
    return `status-${status}`;
  }

  getStatusText(status: ReservationStatus): string {
    // Map the enum values to display text
    const statusMap: { [key in ReservationStatus]: string } = {
      [ReservationStatus.EnAttente]: 'En Attente',
      [ReservationStatus.Confirmee]: 'Confirmée',
      [ReservationStatus.Annulee]: 'Annulée',
      [ReservationStatus.Terminee]: 'Terminée'
    };
    return statusMap[status] || status;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateFilteredReservations();
    }
  }

  nextPage() {
    if (this.filteredReservations.length === this.itemsPerPage) {
      this.currentPage++;
      this.updateFilteredReservations();
    }
  }

  updateFilteredReservations() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredReservations = this.reservations.slice(startIndex, endIndex);
  }

  get paginatedReservations(): Reservation[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredReservations.slice(startIndex, startIndex + this.itemsPerPage);
  }

  showFilters: boolean = false; 

  // Add these methods to your component class

  /**
   * Clear the search term and refresh filters
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.filterReservations();
  }

  /**
   * Select a status and apply filter
   */
  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.filterReservations();
  }

  /**
   * Get the display label for a status
   */
  getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'all': 'Tous',
      'EnAttente': 'En Attente',
      'Confirmee': 'Confirmée',
      'Annulee': 'Annulée',
      'Terminee': 'Terminée'
    };
    return statusLabels[status] || status;
  }
}
