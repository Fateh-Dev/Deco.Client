import { Component } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';

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

  constructor(private router: Router, public auth: AuthService) {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/login']);
    }
  }

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

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}