import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client';
import { CreateClientComponent } from './create-client/create-client.component';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, switchMap } from 'rxjs';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateClientComponent],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss']
})
export class ClientListComponent implements OnInit, OnDestroy {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  isSearching: boolean = false;
  
  // Modal states
  showCreateModal: boolean = false;
  showDeleteModal: boolean = false;
  showSuccessModal: boolean = false;
  showErrorModal: boolean = false;
  
  // Selected clients for operations
  selectedClient: Client | null = null;
  clientToDelete: Client | null = null;
  
  // Loading states
  isDeleting: boolean = false;

  // Search subject for debouncing
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadClients();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged(), // Only trigger if search term changed
      takeUntil(this.destroy$),
      switchMap(searchTerm => {
        if (!searchTerm.trim()) {
          // If search term is empty, return all clients
          return this.clientService.getClients();
        }
        this.isSearching = true;
        // Use server-side search
        return this.clientService.getClients(searchTerm);
      })
    ).subscribe({
      next: (clients) => {
        this.filteredClients = clients;
        this.isSearching = false;
        this.error = null;
      },
      error: (err) => {
        console.error('Error during search:', err);
        this.error = err.message || 'Erreur lors de la recherche. Veuillez réessayer.';
        this.isSearching = false;
        
        // Fallback to client-side filtering if server search fails
        this.filteredClients = this.clientService.filterClientsLocally(this.clients, this.searchTerm);
      }
    });
  }

  loadClients(): void {
    this.isLoading = true;
    this.error = null;
    
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.filteredClients = [...clients];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading clients:', err);
        this.error = 'Failed to load clients. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    // Trigger search through the subject for debouncing
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchSubject.next('');
  }

  // Alternative method using client-side filtering (immediate response)
  onSearchImmediate(): void {
    if (!this.searchTerm.trim()) {
      this.filteredClients = [...this.clients];
      return;
    }

    this.filteredClients = this.clientService.filterClientsLocally(this.clients, this.searchTerm);
  }

  // Create Modal methods
  openCreateModal(): void {
    this.selectedClient = null;
    this.showCreateModal = true;
    this.clearMessages();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.selectedClient = null;
  }

  onClientCreated(newClient: Client): void {
    this.loadClients();
    this.closeCreateModal();
    this.showSuccessMessage('Client créé avec succès');
  }

  // Update Modal methods
  openUpdateModal(client: Client): void {
    this.selectedClient = { ...client }; // Create a copy to avoid direct mutation
    this.showCreateModal = true;
    this.clearMessages();
  }

  onClientUpdated(updatedClient: Client): void {
    this.loadClients();
    this.closeCreateModal();
    this.showSuccessMessage('Client modifié avec succès');
  }

  // Delete Modal methods
  openDeleteModal(client: Client): void {
    this.clientToDelete = client;
    this.showDeleteModal = true;
    this.clearMessages();
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.clientToDelete = null;
  }

  confirmDelete(): void {
    if (!this.clientToDelete?.id) {
      return;
    }

    this.isDeleting = true;
    this.error = null;

    this.clientService.deleteClient(this.clientToDelete.id).subscribe({
      next: () => {
        this.showSuccessMessage(`Client "${this.clientToDelete!.name}" supprimé avec succès`);
        this.loadClients();
        this.showDeleteModal = false;
        this.clientToDelete = null;
        this.isDeleting = false;
      },
      error: (err) => {
        console.error('Error deleting client:', err);
        this.error = err.message || 'Erreur lors de la suppression du client. Veuillez réessayer.';
        this.isDeleting = false;
      }
    });
  }

  // View client details (placeholder for future implementation)
  viewClient(client: Client): void {
    console.log('View client details:', client);
    // TODO: Implement client details view
    // This could open a details modal or navigate to a details page
  }

  // Success Modal methods
  showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccessModal = true;
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.successMessage = null;
  }

  // Error Modal methods
  showErrorMessage(message: string): void {
    this.error = message;
    this.showErrorModal = true;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.error = null;
  }

  // Utility methods
  private clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }
}