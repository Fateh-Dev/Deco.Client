import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs'; 
import { ReservationService } from '../../../services/reservation.service';
import { Reservation, ReservationStatus } from '../../../models/reservation';
import { ReservationItem } from '../../../models/reservation-item';

@Component({
  selector: 'app-reservation-detail-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reservation-detail-dialog.component.html',
  styleUrls: ['./reservation-detail-dialog.component.scss']
})
export class ReservationDetailDialogComponent implements OnInit, OnDestroy {
  @Input() reservationId!: number;
  @Input() isVisible: boolean = false;
  @Output() closeDialog = new EventEmitter<void>();
  
  reservation: Reservation | null = null;
  loading = true;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(private reservationService: ReservationService) {}

  ngOnInit(): void {
    if (this.reservationId) {
      this.loadReservationDetails();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReservationDetails(): void {
    this.loading = true;
    this.error = null;

    this.reservationService.getReservation(this.reservationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reservation) => {
          this.reservation = reservation;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading reservation details:', error);
          this.error = 'Erreur lors du chargement des détails de la réservation';
          this.loading = false;
        }
      });
  }

  getStatusClass(status: ReservationStatus): string {
    const statusClasses: { [key in ReservationStatus]: string } = {
      [ReservationStatus.EnAttente]: 'bg-orange-100 text-orange-800 border-orange-200',
      [ReservationStatus.Confirmee]: 'bg-green-100 text-green-800 border-green-200',
      [ReservationStatus.Annulee]: 'bg-red-100 text-red-800 border-red-200',
      [ReservationStatus.Terminee]: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  getStatusText(status: ReservationStatus): string {
    const statusMap: { [key in ReservationStatus]: string } = {
      [ReservationStatus.EnAttente]: 'En Attente',
      [ReservationStatus.Confirmee]: 'Confirmée',
      [ReservationStatus.Annulee]: 'Annulée',
      [ReservationStatus.Terminee]: 'Terminée'
    };
    return statusMap[status] || status;
  }

  getStatusIcon(status: ReservationStatus): string {
    const statusIcons: { [key in ReservationStatus]: string } = {
      [ReservationStatus.EnAttente]: 'fas fa-clock',
      [ReservationStatus.Confirmee]: 'fas fa-check-circle',
      [ReservationStatus.Annulee]: 'fas fa-times-circle',
      [ReservationStatus.Terminee]: 'fas fa-flag-checkered'
    };
    return statusIcons[status] || 'fas fa-question-circle';
  }

  calculateDurationDays(): number {
    if (!this.reservation) return 0;
    const start = new Date(this.reservation.startDate);
    const end = new Date(this.reservation.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime()+1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  calculateSubtotal(item: ReservationItem): number {
    return item.quantity * item.unitPrice * (item.durationDays || this.calculateDurationDays());
  }

  onClose(): void {
    this.closeDialog.emit();
  }

  onRetry(): void {
    this.loadReservationDetails();
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}