import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client';
import { CreateClientComponent } from './create-client/create-client.component';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateClientComponent],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss']
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  successMessage: string | null = null;
  
  // Modal states
  showCreateModal: boolean = false;
  showDeleteModal: boolean = false;
  
  // Selected clients for operations
  selectedClient: Client | null = null;
  clientToDelete: Client | null = null;
  
  // Loading states
  isDeleting: boolean = false;

  constructor(private clientService: ClientService) {}

  ngOnInit(): void {
    this.loadClients();
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
    if (!this.searchTerm.trim()) {
      this.filteredClients = [...this.clients];
      return;
    }

    this.clientService.searchClients(this.searchTerm).subscribe({
      next: (filtered) => {
        this.filteredClients = filtered;
      },
      error: (err) => {
        console.error('Error searching clients:', err);
        this.error = err.message || 'Error performing search. Please try again.';
        this.filteredClients = [];
      }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredClients = [...this.clients];
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

  // Utility methods
  private showSuccessMessage(message: string): void {
    this.successMessage = message;
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  private clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }
}