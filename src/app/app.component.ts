import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'LocationDeco.Client';
  mobileMenuOpen = false;

  navItems: NavItem[] = [
    { label: 'Accueil', route: '/home' },
    { label: 'Articles', route: '/articles' },
    { label: 'Réservations', route: '/reservation' },
    { label: 'Clients', route: '/clients' }
  ];
  onCreateReservation(): void {
    console.log('Creating reservation...');
  }
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}
