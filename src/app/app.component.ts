import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { AutoLockService } from './core/services/auto-lock.service';
import { Subscription } from 'rxjs';

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
export class AppComponent implements OnInit, OnDestroy {
  isLocked = false;
  private lockSubscription: Subscription | null = null;
  title = 'LocationDeco.Client';
  isExpanded = false;

  constructor(
    private router: Router, 
    public auth: AuthService,
    private autoLockService: AutoLockService
  ) {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    this.lockSubscription = this.autoLockService.isLocked$.subscribe(locked => {
      this.isLocked = locked;
    });
  }

  ngOnDestroy() {
    if (this.lockSubscription) {
      this.lockSubscription.unsubscribe();
    }
  }

  navItems: NavItem[] = [
    { label: 'Accueil', route: '/home' },
    { label: 'Calendrier', route: '/calendar' },
    { label: 'Articles', route: '/articles' },
    { label: 'Réservations', route: '/reservations' },
    { label: 'Clients', route: '/clients' },
    { label: 'Galerie', route: '/gallery' },
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