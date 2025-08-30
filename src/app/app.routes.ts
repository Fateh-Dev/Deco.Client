import { Routes } from '@angular/router';
import { ArticleListComponent } from './components/article-list/article-list.component';
import { HomePageComponent } from './components/home-page/home-page.component'; 
import { ReservationsComponent } from './components/reservations/reservations.component'; 
import { ClientListComponent } from './components/client-list/client-list.component';
import { CreateReservationComponent } from './components/reservations/create-reservation/create-reservation.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { SettingsComponent } from './components/settings/settings.component';
import { LoginComponent } from './auth/login.component';
import { RegisterComponent } from './auth/register.component';
import { LockScreenComponent } from './lock-screen/lock-screen.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Lock screen route
  { 
    path: 'lock', 
    component: LockScreenComponent,
    data: { title: 'Session verrouillée' }
  },
  
  // Protected routes
  { 
    path: '', 
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: '/home', pathMatch: 'full' },
      { path: 'home', component: HomePageComponent },
      { path: 'articles', component: ArticleListComponent }, 
      { path: 'reservations', component: ReservationsComponent },
      { path: 'reservations/new', component: CreateReservationComponent },
      { path: 'reservations/new/:date', component: CreateReservationComponent },
      { path: 'reservations/edit/:id', component: CreateReservationComponent },
      { path: 'clients', component: ClientListComponent },
      { path: 'calendar', component: CalendarComponent },
      { path: 'administration', component: SettingsComponent },
    ]
  },
  
  // Fallback route
  { path: '**', redirectTo: 'home' }
];
