import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LocationService } from '../../services/location.service';
import { Location } from '../../models/location';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">LocationDeco</h1>
          <p class="mt-2 text-gray-600">Manage your favorite locations</p>
        </div>

        <div class="mb-6 flex justify-between items-center">
          <h2 class="text-2xl font-semibold text-gray-800">Locations</h2>
          <button 
            routerLink="/locations/new"
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
            Add New Location
          </button>
        </div>

        <div *ngIf="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <div *ngIf="!loading && locations.length === 0" class="text-center py-12">
          <div class="text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No locations</h3>
            <p class="mt-1 text-sm text-gray-500">Get started by creating a new location.</p>
          </div>
        </div>

        <div *ngIf="!loading && locations.length > 0" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div 
            *ngFor="let location of locations" 
            class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
            <div class="p-6">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ location.name }}</h3>
                  <p *ngIf="location.description" class="text-gray-600 text-sm mb-3">{{ location.description }}</p>
                  
                  <div class="space-y-2 text-sm text-gray-500">
                    <div class="flex items-center">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {{ location.address }}
                    </div>
                    
                    <div *ngIf="location.city || location.state" class="flex items-center">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {{ location.city }}{{ location.city && location.state ? ', ' : '' }}{{ location.state }}
                    </div>
                    
                    <div *ngIf="location.phoneNumber" class="flex items-center">
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {{ location.phoneNumber }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mt-4 flex space-x-2">
                <button 
                  [routerLink]="['/locations', location.id, 'edit']"
                  class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-3 rounded-md text-sm transition-colors duration-200">
                  Edit
                </button>
                <button 
                  (click)="deleteLocation(location.id!)"
                  class="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-3 rounded-md text-sm transition-colors duration-200">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LocationListComponent implements OnInit {
  locations: Location[] = [];
  loading = true;

  constructor(private locationService: LocationService) {}

  ngOnInit(): void {
    this.loadLocations();
  }

  loadLocations(): void {
    this.loading = true;
    this.locationService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.loading = false;
      }
    });
  }

  deleteLocation(id: number): void {
    if (confirm('Are you sure you want to delete this location?')) {
      this.locationService.deleteLocation(id).subscribe({
        next: () => {
          this.locations = this.locations.filter(loc => loc.id !== id);
        },
        error: (error) => {
          console.error('Error deleting location:', error);
          alert('Error deleting location');
        }
      });
    }
  }
}
