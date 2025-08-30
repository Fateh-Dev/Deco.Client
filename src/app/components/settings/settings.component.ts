import { Component, OnInit } from '@angular/core';  
import { CategoryService } from '../../services/category.service'; 
import { Category } from '../../models/category';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth.service';

interface LookupTable {
  id: string;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-settings', 
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  // Lookup tables configuration
  lookupTables: LookupTable[] = [
    {
      id: 'categories',
      name: 'Categories',
      icon: 'fas fa-tags',
      description: 'Manage product categories'
    },
    {
      id: 'security',
      name: 'Security',
      icon: 'fas fa-lock',
      description: 'Manage account security settings'
    },
    // {
    //   id: 'statuses',
    //   name: 'Statuses',
    //   icon: 'fas fa-flag',
    //   description: 'Manage status types'
    // },
    // {
    //   id: 'priorities',
    //   name: 'Priorities',
    //   icon: 'fas fa-exclamation-triangle',
    //   description: 'Manage priority levels'
    // },
    // {
    //   id: 'departments',
    //   name: 'Departments',
    //   icon: 'fas fa-building',
    //   description: 'Manage departments'
    // },
    // {
    //   id: 'roles',
    //   name: 'Roles',
    //   icon: 'fas fa-users',
    //   description: 'Manage user roles'
    // }
  ];

  selectedLookupTable: LookupTable | null = null;
  categories: Category[] = [];
  selectedCategory: Category | null = null;
  isModalOpen = false;
  isEditMode = false;
  isViewMode = false;
  loading = false;
  error = '';
  successMessage = '';

  // Password change form and related properties
  passwordForm: FormGroup;
  passwordError = '';
  passwordSuccess = '';
  passwordLoading = false;

  categoryForm: Category = {
    id: 0,
    name: ''
  };

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    // Initialize password form with custom validator
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Select first lookup table by default
    if (this.lookupTables.length > 0) {
      this.selectLookupTable(this.lookupTables[0]);
    }
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      return { mismatch: true };
    }
    return null;
  }

  selectLookupTable(lookupTable: LookupTable): void {
    this.selectedLookupTable = lookupTable;
    this.closeModal(); // Close any open modals
    this.error = '';
    this.successMessage = '';
    this.passwordError = '';
    this.passwordSuccess = '';
    
    // Load data based on selected lookup table
    switch (lookupTable.id) {
      case 'categories':
        this.loadCategories();
        break;
      case 'security':
        // Reset password form when security is selected
        this.passwordForm.reset();
        break;
      default:
        // For now, only categories and security are implemented
        this.categories = [];
        break;
    }
  }

  loadCategories(): void {
    this.loading = true;
    this.error = '';
    
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load categories. Please try again.';
        this.loading = false;
        console.error('Error loading categories:', error);
      }
    });
  }

  // Password change functionality
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordError = 'Please fill in all required fields correctly.';
      return;
    }

    this.passwordLoading = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: (response) => {
        this.passwordSuccess = 'Password changed successfully!';
        this.passwordForm.reset();
        this.passwordLoading = false;
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          this.passwordSuccess = '';
        }, 5000);
      },
      error: (error) => {
        this.passwordError = error.error?.message || 'Failed to change password. Please try again.';
        this.passwordLoading = false;
        console.error('Error changing password:', error);
      }
    });
  }

  openCreateModal(): void {
    if (!this.selectedLookupTable) return;
    
    this.isModalOpen = true;
    this.isEditMode = false;
    this.isViewMode = false;
    this.resetForm();
  }

  viewCategory(category: Category): void {
    this.selectedCategory = category;
    this.categoryForm = { ...category };
    this.isModalOpen = true;
    this.isViewMode = true;
    this.isEditMode = false;
  }

  editCategory(category: Category): void {
    this.selectedCategory = category;
    this.categoryForm = { ...category };
    this.isModalOpen = true;
    this.isEditMode = true;
    this.isViewMode = false;
  }

  deleteCategory(category: Category): void {
    if (!category.id) {
      this.error = 'Invalid category selected for deletion.';
      return;
    }

    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.showSuccessMessage('Category deleted successfully!');
          this.loadCategories();
        },
        error: (error) => {
          this.error = 'Failed to delete category. Please try again.';
          console.error('Error deleting category:', error);
        }
      });
    }
  }

  saveCategory(): void {
    if (!this.categoryForm.name.trim()) {
      this.error = 'Category name is required.';
      return;
    }

    this.error = '';
    
    if (this.isEditMode && this.selectedCategory) {
      this.updateCategory();
    } else {
      this.createCategory();
    }
  }

  createCategory(): void {
    const newCategory: Category = {
      id: 0,
      name: this.categoryForm.name.trim() 
    };

    this.categoryService.createCategory(newCategory).subscribe({
      next: () => {
        this.showSuccessMessage('Category created successfully!');
        this.closeModal();
        this.loadCategories();
      },
      error: (error) => {
        this.error = 'Failed to create category. Please try again.';
        console.error('Error creating category:', error);
      }
    });
  }

  updateCategory(): void {
    if (!this.selectedCategory || !this.selectedCategory.id) {
      this.error = 'Invalid category selected for update.';
      return;
    }

    const updatedCategory: Category = {
      ...this.selectedCategory,
      name: this.categoryForm.name.trim() 
    };

    this.categoryService.updateCategory(this.selectedCategory.id, updatedCategory).subscribe({
      next: () => {
        this.showSuccessMessage('Category updated successfully!');
        this.closeModal();
        this.loadCategories();
      },
      error: (error) => {
        this.error = 'Failed to update category. Please try again.';
        console.error('Error updating category:', error);
      }
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.isViewMode = false;
    this.selectedCategory = null;
    this.resetForm();
    this.error = '';
  }

  resetForm(): void {
    this.categoryForm = {
      id: 0,
      name: '' 
    };
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  trackByFn(index: number, item: Category): number {
    return item.id ?? 0;
  }

  getModalTitle(): string {
    if (!this.selectedLookupTable) return '';
    
    const tableName = this.selectedLookupTable.name.slice(0, -1); // Remove 's' from plural
    if (this.isViewMode) return `View ${tableName}`;
    if (this.isEditMode) return `Edit ${tableName}`;
    return `Create New ${tableName}`;
  }

  getCurrentTableDisplayName(): string {
    return this.selectedLookupTable?.name || '';
  }

  getCurrentTableDescription(): string {
    return this.selectedLookupTable?.description || '';
  }

  // Helper method to check if current table is categories
  isCategoriesSelected(): boolean {
    return this.selectedLookupTable?.id === 'categories';
  }

  // Helper method to check if current table is security
  isSecuritySelected(): boolean {
    return this.selectedLookupTable?.id === 'security';
  }

  // Helper method to get button text based on selected table
  getAddButtonText(): string {
    if (!this.selectedLookupTable) return 'Add Item';
    const singular = this.selectedLookupTable.name.slice(0, -1);
    return `Add ${singular}`;
  }
  
}