import { Component, HostListener } from "@angular/core";
import { AuthService } from "./auth.service";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: "./login.component.html",
  // styleUrls: ["./login.component.css"]
})
export class LoginComponent {
  username = "";
  password = "";
  error = "";
  isLoading = false;
  showPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  login() {
    if (!this.username || !this.password) {
      this.error = "Please fill in all fields";
      return;
    }

    this.isLoading = true;
    this.error = "";

    this.auth.login(this.username, this.password).subscribe({
      next: res => {
        localStorage.setItem("token", res.token);
        this.error = "";
        this.isLoading = false;
        // Redirect to calendar page
        this.router.navigate(['/calendar']);
      },
      error: err => {
        this.error = err.error?.message || "Invalid credentials";
        this.isLoading = false;
      }
    });
  }

  showRegisterLink = false; // Property to control register link visibility

  // Variables for tracking Alt+gen sequence
  private keySequence: string = "";
  private isAltPressed: boolean = false;
  private sequenceTimer: any;

  // Listen for keydown events
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Handle Escape key to hide register link
    if (event.key === 'Escape') {
      this.showRegisterLink = false;
      return;
    }

    // Track Alt key state
    if (event.key === 'Alt') {
      this.isAltPressed = true;
      this.keySequence = ""; // Reset sequence when Alt is pressed
      return;
    }

    // If Alt is pressed and user types letters
    if (this.isAltPressed && event.key.length === 1) {
      event.preventDefault();
      event.stopPropagation();
      
      this.keySequence += event.key.toLowerCase();
      
      // Check if sequence matches "gen"
      if (this.keySequence === "gen") {
        this.showRegisterLink = true;
        this.keySequence = ""; // Reset sequence
        console.log("Register link activated!"); // Optional: for debugging
      }
      
      // Reset sequence if it gets too long or doesn't match pattern
      if (this.keySequence.length > 3 || !("gen".startsWith(this.keySequence))) {
        this.keySequence = "";
      }
      
      // Reset sequence after 2 seconds of inactivity
      if (this.sequenceTimer) {
        clearTimeout(this.sequenceTimer);
      }
      this.sequenceTimer = setTimeout(() => {
        this.keySequence = "";
      }, 2000);
    } else if (event.key.length === 1) {
      // Reset sequence if typing without Alt key
      this.keySequence = "";
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    // Reset Alt state when released
    if (event.key === 'Alt') {
      this.isAltPressed = false;
      // Don't reset sequence immediately - allow completion if Alt is released after typing
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}