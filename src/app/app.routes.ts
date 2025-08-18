import { Routes } from '@angular/router';
import { ArticleListComponent } from './components/article-list/article-list.component';
import { HomePageComponent } from './components/home-page/home-page.component'; 
import { ReservationsComponent } from './components/reservations/reservations.component'; 
import { ClientListComponent } from './components/client-list/client-list.component';
import { CreateReservationComponent } from './components/reservations/create-reservation/create-reservation.component';
import { CalendarComponent } from './components/calendar/calendar.component';
import { SettingsComponent } from './components/settings/settings.component';
export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'home', component: HomePageComponent },
  { path: 'articles', component: ArticleListComponent }, 
  { path: 'reservations', component: ReservationsComponent }, // Temporary - replace with actual reservations component
  { path: 'reservations/new', component: CreateReservationComponent }, // Temporary - replace with actual reservations component
  { path: 'clients', component: ClientListComponent }, // Temporary - replace with actual clients component
  { path: 'calendar', component: CalendarComponent }, // Temporary - replace with actual calendar component
  { path: 'administration', component: SettingsComponent }, // Temporary - replace with actual calendar component
  { path: '**', redirectTo: '' }
];
