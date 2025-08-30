import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { AutoLockService } from '../services/auto-lock.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private autoLockService: AutoLockService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    // If not logged in, clear any lock state and redirect to login
    if (!this.authService.isLoggedIn()) {
      localStorage.removeItem('app_locked');
      localStorage.removeItem('locked_username');
      return this.router.createUrlTree(['/login']);
    }

    // Only check for lock state if we're not already on the lock screen
    if (this.router.url !== '/lock') {
      const isLocked = localStorage.getItem('app_locked') === 'true';
      
      // If app is locked, redirect to lock screen with return URL
      if (isLocked) {
        return this.router.createUrlTree(['/lock'], {
          queryParams: { returnUrl: this.router.url }
        });
      }
    }
    
    // If we get here, either we're on the lock screen or the app is not locked
    return true;
  }
}
