import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CustomersService } from '../../../services/customers.service';
import { EmailMfa, securityCustomer, UpdatePassword } from '../../../models/customers';
import { NgIf } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

export function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;

  const hasUpperCase = /[A-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/.test(value);

  if (hasUpperCase && hasNumber && hasSpecialChar) return null;

  return {
    passwordStrength: {
      requiresUpperCase: !hasUpperCase,
      requiresNumber: !hasNumber,
      requiresSpecialChar: !hasSpecialChar
    }
  };
}

function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { passwordsNotEqual: true };
  }
  return null;
}

@Component({
  selector: 'app-change-security',
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './change-security.component.html',
  styleUrl: './change-security.component.css'
})
export class ChangeSecurityComponent implements OnInit, OnDestroy {
  public modified = false;
  public modifiedPassword = false;
  public passwordChangeError: string | null = null;
  public updateDataError: string | null = null;
  public securityCustomer: securityCustomer | null = null;

  public showOldPassword = false;
  public showNewPassword = false;
  public showConfirmPassword = false;

  public emailForm!: FormGroup;
  public passwordForm = new FormGroup({
    oldPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(6), passwordStrengthValidator]),
    confirmPassword: new FormControl('', [Validators.required, Validators.minLength(6), passwordStrengthValidator]),
  }, { validators: [passwordMatchValidator] });

  private customerService = inject(CustomersService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    const current = this.customerService.getCurrentSecurityCustomer();

    if (!current) {
      this.customerService.getSecurityInfo()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (security) => {
            this.customerService.setSecurityInfo(security);
          },
          error: (err) => {
            //console.error('Errore nel recupero delle info di sicurezza:', err);
          }
        });
    }

    this.customerService.securityCustomer$
      .pipe(takeUntil(this.destroy$))
      .subscribe((security) => {
        this.securityCustomer = security;

        if (!this.emailForm) {
          this.emailForm = new FormGroup({
            email: new FormControl(security?.emailAddress, [Validators.required, Validators.email]),
            mfaEnabled: new FormControl(security?.isMfaEnabled),
          });
        } else {
          this.emailForm.patchValue({
            email: security?.emailAddress,
            mfaEnabled: security?.isMfaEnabled,
          });
        }

        if (!security?.isEmailConfirmed) {
          this.emailForm.get('mfaEnabled')?.disable();
        } else {
          this.emailForm.get('mfaEnabled')?.enable();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleOldPassword = () => this.showOldPassword = !this.showOldPassword;
  toggleNewPassword = () => this.showNewPassword = !this.showNewPassword;
  toggleConfirmPassword = () => this.showConfirmPassword = !this.showConfirmPassword;

  richiediConfermaEmail() {
    this.modified = true;
    this.updateDataError = null;

    this.customerService.requestEmailConfirmation().subscribe({
      next: (response) => {
        Swal.fire({
                  icon: 'success',
                  title: 'Conferma la tua email cliccando sul link che ti abbiamo inviato.',
                  confirmButtonColor: '#013220df'
        });
      },
      error: (err) => {
        const errorMessage = this.extractErrorMessage(err, 'Errore durante l\'invio dell\'email di conferma.');
        //console.error('Errore conferma email:', errorMessage);
        alert(errorMessage);
      }
    });
  }

  onPasswordSubmit() {
    this.modifiedPassword = false;
    this.passwordChangeError = null;

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const updatePassword: UpdatePassword = {
      oldPassword: this.passwordForm.value.oldPassword!,
      newPassword: this.passwordForm.value.newPassword!
    };

    this.customerService.updatePassword(updatePassword).subscribe({
      next: (response) => {
        Swal.fire({
                  icon: 'success',
                  title: 'Password aggiornata con successo',
                  confirmButtonColor: '#013220df'
        });
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        this.modifiedPassword = true;
        this.passwordForm.reset();
      },
      error: (err) => {
        this.passwordChangeError = this.extractErrorMessage(err, 'Errore durante la modifica della password.');
        //console.error('Errore password:', this.passwordChangeError);
      }
    });
  }

  onEmailSubmit() {
    this.modified = false;
    this.updateDataError = null;

    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const emailMfa: EmailMfa = {
      emailAddress: this.emailForm.value.email!,
      isMfaEnabled: this.emailForm.value.mfaEnabled!
    };

    this.customerService.enableEmailMfa(emailMfa).subscribe({
      next: () => {
        Swal.fire({
                  icon: 'success',
                  title: 'Dati aggiornati con successo',
                  confirmButtonColor: '#013220df'
        });
        this.modified = true;
        this.customerService.getSecurityInfo()
          .pipe(takeUntil(this.destroy$))
          .subscribe((updated) => this.customerService.setSecurityInfo(updated));
      },
      error: (err) => {
        this.updateDataError = this.extractErrorMessage(err, 'Errore durante l\'aggiornamento delle impostazioni.');
        //console.error('Errore aggiornamento email/mfa:', this.updateDataError);
        alert(this.updateDataError);
      }
    });
  }

  private extractErrorMessage(err: any, defaultMessage: string): string {
    if (err?.error && typeof err.error === 'string') return err.error;
    if (err?.error?.message && typeof err.error.message === 'string') return err.error.message;
    if (err?.message) return err.message;
    return defaultMessage;
  }
}
