import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subscription, timer, firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AutoLockService implements OnDestroy {
  private readonly LOCK_TIMEOUT = 10 * 60 * 1000; // 2 minutes in milliseconds
  private timerSubscription: Subscription | null = null;
  private isLockedSubject = new BehaviorSubject<boolean>(false);
  isLocked$ = this.isLockedSubject.asObservable();

  private readonly LOCK_STORAGE_KEY = 'app_locked';

  constructor(
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private configService: ConfigService
  ) {
    this.initializeLockState();
    this.setupActivityListeners();
  }

  private initializeLockState(): void {
    if (!this.authService.isLoggedIn()) {
      // Clear lock state if user is not authenticated
      localStorage.removeItem(this.LOCK_STORAGE_KEY);
      localStorage.removeItem('locked_username');
      return;
    }
    
    const isLocked = localStorage.getItem(this.LOCK_STORAGE_KEY) === 'true';
    if (isLocked) {
      this.isLockedSubject.next(true);
    }
  }

  private setupActivityListeners(): void {
    // Listen to user activity events
    window.addEventListener('mousemove', this.resetTimer.bind(this));
    window.addEventListener('keydown', this.resetTimer.bind(this));
    window.addEventListener('click', this.resetTimer.bind(this));
    window.addEventListener('scroll', this.resetTimer.bind(this));

    // Initialize the timer
    this.resetTimer();
  }

  private resetTimer(): void {
    // Don't reset if already locked
    if (this.isLockedSubject.value) return;

    // Clear existing timer
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }

    // Start a new timer
    this.timerSubscription = timer(this.LOCK_TIMEOUT).subscribe(() => {
      this.lockApp();
    });
  }

  lockApp(): void {
    if (this.authService.isLoggedIn()) {
      // Store the username before logging out
      const user = this.authService.getCurrentUser();
      if (user && user.name) {
        localStorage.setItem('locked_username', user.name);
      }
      
      // Clear the token to log the user out
      localStorage.removeItem('token');
      
      // Set the app as locked
      localStorage.setItem(this.LOCK_STORAGE_KEY, 'true');
      this.isLockedSubject.next(true);
      this.router.navigate(['/lock']);
    }
  }

  async unlockApp(password: string): Promise<boolean> {
    try {
      const username = localStorage.getItem('locked_username');
      if (!username) {
        throw new Error('No locked user found');
      }

      // Call the login endpoint to verify the password
      const response = await firstValueFrom(
        this.http.post<{ token: string }>(`${this.configService.apiUrl}/auth/login`, { username, password })
      );

      if (response.token) {
        // Store the new token
        localStorage.setItem('token', response.token);
        
        // Clear the locked state and username
        localStorage.removeItem(this.LOCK_STORAGE_KEY);
        localStorage.removeItem('locked_username');
        
        this.isLockedSubject.next(false);
        this.resetTimer();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Unlock failed:', error);
      return false;
    }
  }

  ngOnDestroy(): void {
    // Clean up event listeners and subscriptions
    window.removeEventListener('mousemove', this.resetTimer.bind(this));
    window.removeEventListener('keydown', this.resetTimer.bind(this));
    window.removeEventListener('click', this.resetTimer.bind(this));
    window.removeEventListener('scroll', this.resetTimer.bind(this));
    
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
}
