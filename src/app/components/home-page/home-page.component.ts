import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { ReservationService } from '../../services/reservation.service';
import { UserService } from '../../services/user.service';
import { Article } from '../../models/article';
import { Reservation } from '../../models/reservation';
import { User } from '../../models/user';

// Add Material Icons CSS in index.html:
// <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  articles: Article[] = [];
  reservations: Reservation[] = [];
  users: User[] = [];
  
  // Dashboard statistics
  totalArticles = 0;
  totalReservations = 0;
  totalUsers = 0;
  totalStock = 0;
  
  // Loading states
  loading = true;
  error = '';

  constructor(
    private articleService: ArticleService,
    private reservationService: ReservationService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = '';

    // Load articles
    this.articleService.getArticles().subscribe({
      next: (articles) => {
        this.articles = articles;
        this.totalArticles = articles.length;
        this.totalStock = articles.reduce((sum, article) => sum + article.quantityTotal, 0);
      },
      error: (error) => {
        console.error('Error loading articles:', error);
        this.error = 'Failed to load articles';
      }
    });

    // Load reservations
    this.reservationService.getReservations().subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.totalReservations = reservations.length;
      },
      error: (error) => {
        console.error('Error loading reservations:', error);
        this.error = 'Failed to load reservations';
      }
    });

    // Load users
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.totalUsers = users.length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  getRecentArticles(): Article[] {
    return this.articles.slice(0, 5);
  }

  getRecentReservations(): Reservation[] {
    return this.reservations.slice(0, 5);
  }
}
