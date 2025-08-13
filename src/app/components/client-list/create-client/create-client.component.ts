import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Client } from '../../../models/client';
import { ClientService } from '../../../services/client.service';

@Component({
  selector: 'app-create-client',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create-client.component.html',
  styleUrls: ['./create-client.component.scss']
})
export class CreateClientComponent implements OnInit, OnChanges {
  @Input() clientToEdit: Client | null = null;
  @Output() clientCreated = new EventEmitter<Client>();
  @Output() clientUpdated = new EventEmitter<Client>();
  @Output() cancel = new EventEmitter<void>();
  
  clientForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  isEditMode = false;

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
    this.setupForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clientToEdit']) {
      this.setupForm();
    }
  }

  private setupForm(): void {
    this.isEditMode = !!this.clientToEdit;
    
    if (this.clientToEdit) {
      // Populate form with existing client data
      this.clientForm.patchValue({
        name: this.clientToEdit.name,
        phone: this.clientToEdit.phone,
        email: this.clientToEdit.email || '',
        eventType: this.clientToEdit.eventType || '',
        address: this.clientToEdit.address || '',
        companyName: this.clientToEdit.companyName || ''
      });
    } else {
      // Reset form for new client
      this.clientForm.reset();
    }
    
    this.error = null;
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.markFormGroupTouched(this.clientForm);
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    if (this.isEditMode && this.clientToEdit) {
      this.updateClient();
    } else {
      this.createClient();
    }
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
      },
      error: (error) => {
        console.error('Error saving client:', error);
        this.error = error.message || 'Une erreur est survenue lors de la création du client. Veuillez réessayer.';
        this.isSubmitting = false;
      }
    });
  }

  private updateClient(): void {
    if (!this.clientToEdit?.id) {
      this.error = 'Erreur: ID du client manquant.';
      this.isSubmitting = false;
      return;
    }

    const updatedClient: Client = {
      ...this.clientToEdit,
      ...this.clientForm.value
    };

    this.clientService.updateClient(updatedClient).subscribe({
      next: (savedClient) => {
        this.clientUpdated.emit(savedClient);
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error updating client:', error);
        this.error = error.message || 'Une erreur est survenue lors de la modification du client. Veuillez réessayer.';
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper method to check if a field has an error
  hasError(controlName: string, errorType: string): boolean {
    const control = this.clientForm.get(controlName);
    return control ? control.hasError(errorType) && (control.dirty || control.touched) : false;
  }

  // Getter for button text
  get submitButtonText(): string {
    if (this.isSubmitting) {
      return this.isEditMode ? 'Modification...' : 'Enregistrement...';
    }
    return this.isEditMode ? 'Modifier' : 'Enregistrer';
  }

  // Getter for form title (can be used in template if needed)
  get formTitle(): string {
    return this.isEditMode ? 'Modifier le client' : 'Nouveau client';
  }
}