import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ReservationService } from '../../services/reservation.service';
import { Reservation, ReservationStatus } from '../../models/reservation';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client';
import { ReservationDetailDialogComponent } from './reservation-detail-dialog/reservation-detail-dialog.component';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReservationDetailDialogComponent],
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
  showFilters: boolean = false;
  showCreateForm: boolean = false;
  
  // Dialog state
  showDetailDialog: boolean = false;
  selectedReservationId: number | null = null;
 
  private destroy$ = new Subject<void>();

  constructor(
    private reservationService: ReservationService,
    private clientService: ClientService
  ) { }

  ngOnInit(): void {
    this.loadReservations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showCreateReservation(): void {
    this.showCreateForm = true;
  }

  onCancelCreate(): void {
    this.showCreateForm = false;
  }

  onReservationCreated(newReservation: Reservation): void {
    // Add the new reservation to the beginning of the list
    this.reservations = [newReservation, ...this.reservations];
    this.filteredReservations = [newReservation, ...this.filteredReservations];

    this.totalItems++;
    this.showCreateForm = false;
  }

  /**
   * Open reservation detail dialog
   */
  openReservationDetail(reservationId: number): void {
    this.selectedReservationId = reservationId;
    this.showDetailDialog = true;
  }

  /**
   * Close reservation detail dialog
   */
  closeReservationDetail(): void {
    this.showDetailDialog = false;
    this.selectedReservationId = null;
  }

  loadReservations(): void {
    this.loading = true;
    this.error = null;

    this.reservationService.getReservations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservations) => {
          this.reservations = reservations;
          this.loadClientDataForReservations();
          this.filterReservations();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading reservations:', error);
          this.error = 'Failed to load reservations. Please try again later.';
          this.loading = false;
        }
      });
  }

  /**
   * Loads client data for each reservation
   */
  private loadClientDataForReservations(): void {
    this.reservations.forEach(reservation => {
      if (reservation.clientId && !reservation.client) {
        this.clientService.getClient(reservation.clientId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (client) => {
              reservation.client = client;
              // Update the filtered reservations if needed
              this.filterReservations();
            },
            error: (error) => {
              console.error(`Error loading client data for reservation ${reservation.id}:`, error);
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

      // Filter by search term (search in ID, client name, or client email)
      const searchMatch = !searchTerm ||
        (reservation.id?.toString().includes(searchTerm)) ||
        (reservation.client?.name?.toLowerCase().includes(searchTerm)) ||
        (reservation.client?.email?.toLowerCase().includes(searchTerm));

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
    // Map status to Tailwind CSS classes
    const statusClasses: { [key in ReservationStatus]: string } = {
      [ReservationStatus.EnAttente]: 'bg-orange-100 text-orange-800 border-orange-200',
      [ReservationStatus.Confirmee]: 'bg-green-100 text-green-800 border-green-200',
      [ReservationStatus.Annulee]: 'bg-red-100 text-red-800 border-red-200',
      [ReservationStatus.Terminee]: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateFilteredReservations();
    }
  }

  nextPage(): void {
    if (this.filteredReservations.length === this.itemsPerPage) {
      this.currentPage++;
      this.updateFilteredReservations();
    }
  }

  updateFilteredReservations(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.filteredReservations = this.reservations.slice(startIndex, endIndex);
  }

  get paginatedReservations(): Reservation[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredReservations.slice(startIndex, startIndex + this.itemsPerPage);
  }

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