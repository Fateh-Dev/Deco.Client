import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AutoLockService } from '../core/services/auto-lock.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-lock-screen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-100 to-emerald-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 text-center">
        <div class="mx-auto h-20 w-20 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg mb-6">
          <svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Session verrouillée</h1>
        <p class="text-gray-600 mb-6">Veuillez entrer votre mot de passe pour continuer</p>
        
        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label for="password" class="sr-only">Mot de passe</label>
            <div class="relative">
              <input
                id="password"
                name="password"
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                required
                class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition text-sm"
                placeholder="Entrez votre mot de passe"
                autofocus
              >
              <button 
                type="button"
                (click)="togglePasswordVisibility()"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg *ngIf="!showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg *ngIf="showPassword" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-6.364-6.364m6.364 6.364l6.364-6.364" />
                </svg>
              </button>
            </div>
            <p *ngIf="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
          </div>
          
          <button
            type="submit"
            [disabled]="!password || isLoading"
            class="w-full py-3 px-4 text-sm font-medium rounded-lg text-white bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 focus:ring-2 focus:ring-offset-2 focus:ring-teal-400 shadow-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span *ngIf="!isLoading">Déverrouiller</span>
            <span *ngIf="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Vérification...
            </span>
          </button>
        </form>
 
      </div>
    </div>
  `,
  styles: []
})
export class LockScreenComponent implements OnInit {
  password = '';
  showPassword = false;
  isLoading = false;
  error = '';
  currentUser = 'admin';

  constructor(
    private autoLockService: AutoLockService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get locked username from storage
    const lockedUsername = localStorage.getItem('locked_username');
    if (lockedUsername) {
      this.currentUser = lockedUsername;
    } else {
      // Fallback to current user if available
      const user = this.authService.getCurrentUser();
      if (user && user.name) {
        this.currentUser = user.name;
      }
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit(): Promise<void> {
    if (!this.password) {
      this.error = 'Veuillez entrer votre mot de passe';
      return;
    }
    
    this.isLoading = true;
    this.error = '';
    
    try {
      const success = await this.autoLockService.unlockApp(this.password);
      if (success) {
        // Navigate to the home page or the previously requested URL
        const tree = this.router.parseUrl(this.router.url);
        const returnUrl = tree.queryParams['returnUrl'] || '/';
        await this.router.navigateByUrl(returnUrl);
      } else {
        this.error = 'Mot de passe incorrect';
      }
    } catch (error: any) {
      this.error = error.error?.message || 'Échec du déverrouillage. Veuillez réessayer.';
      console.error('Unlock error:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
