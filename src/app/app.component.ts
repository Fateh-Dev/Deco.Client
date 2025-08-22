import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'LocationDeco.Client';
  isExpanded = false;

  navItems: NavItem[] = [
    { label: 'Accueil', route: '/home' },
    { label: 'Calendrier', route: '/calendar' },
    { label: 'Articles', route: '/articles' },
    { label: 'Réservations', route: '/reservations' },
    { label: 'Clients', route: '/clients' },
    { label: 'Administration', route: '/administration' }
  ];

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  onCreateReservation(): void {
    console.log('Creating reservation...');
    // Add your reservation creation logic here
  }
}