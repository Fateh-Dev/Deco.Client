import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../services/client.service';
import { Client } from '../../models/client';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss']
})
export class ClientListComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  error: string | null = null;

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
        this.error = 'Error performing search. Please try again.';
        this.filteredClients = [];
      }
    });
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredClients = [...this.clients];
  }
}
