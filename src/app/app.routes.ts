import { Routes } from '@angular/router';
import { ArticleListComponent } from './components/article-list/article-list.component';
import { HomePageComponent } from './components/home-page/home-page.component'; 
import { ReservationsComponent } from './components/reservations/reservations.component';
export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'home', component: HomePageComponent },
  { path: 'articles', component: ArticleListComponent },
  { path: 'reservation', component: ReservationsComponent },
  { path: 'reservations', component: ReservationsComponent },
  { path: 'clients', component: HomePageComponent }, // Temporary - replace with actual clients component
  { path: '**', redirectTo: '' }
];
