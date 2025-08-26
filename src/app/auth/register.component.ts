import { Component } from "@angular/core";
import { AuthService } from "./auth.service";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";

@Component({
  selector: "app-register",
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"]
})
export class RegisterComponent {
  name = "";
  email = "";
  phone = "";
  password = "";
  confirmPassword = "";
  error = "";
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  acceptTerms = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  register() {
    // Validation
    if (!this.name || !this.email || !this.phone || !this.password || !this.confirmPassword) {
      this.error = "Please fill in all fields";
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = "Passwords do not match";
      return;
    }

    if (this.password.length < 6) {
      this.error = "Password must be at least 6 characters long";
      return;
    }

    if (!this.acceptTerms) {
      this.error = "Please accept the terms and conditions";
      return;
    }

    this.isLoading = true;
    this.error = "";

    this.auth.register(this.name, this.email, this.phone, this.password).subscribe({
      next: () => {
        this.error = "";
        this.isLoading = false;
        // Redirect to login or dashboard
        this.router.navigate(['/login'], { 
          queryParams: { message: 'Registration successful! Please login.' }
        });
      },
      error: err => {
        this.error = err.error?.message || "Registration failed";
        this.isLoading = false;
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  getPasswordStrength(): string {
    if (this.password.length < 6) return 'weak';
    if (this.password.length < 10) return 'medium';
    return 'strong';
  }

  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  }
}