import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Client } from '../../../models/client';
import { ClientService } from '../../../services/client.service';

@Component({
  selector: 'app-create-client-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create-client-modal.component.html',
  styleUrls: ['./create-client-modal.component.scss']
})
export class CreateClientModalComponent implements OnInit {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() clientCreated = new EventEmitter<Client>();
  
  clientForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService
  ) {
    this.clientForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      email: ['', [Validators.email]],
      eventType: [''],
      address: [''],
      companyName: ['']
    });
  }

  ngOnInit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.clientForm.reset();
    this.error = null;
  }

  onClose(): void {
    this.resetForm();
    this.close.emit();
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.clientForm.controls).forEach(key => {
        const control = this.clientForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isSubmitting = true;
    this.error = null;
    
    this.createClient();
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.clientForm.get(controlName);
    return !!control && control.touched && control.hasError(errorName);
  }

  private createClient(): void {
    const newClient: Client = {
      ...this.clientForm.value,
      isActive: true,
      createdAt: new Date()
    };

    this.clientService.addClient(newClient).subscribe({
      next: (savedClient) => {
        this.clientCreated.emit(savedClient);
        this.isSubmitting = false;
        this.onClose();
      },
      error: (error) => {
        console.error('Error saving client:', error);
        this.error = error.message || 'Une erreur est survenue lors de la création du client. Veuillez réessayer.';
        this.isSubmitting = false;
      }
    });
  }
    // Getter for button text
  get submitButtonText(): string {
    if (this.isSubmitting) {
      return   'Enregistrement...';
    }
    return  'Enregistrer';
  }
}