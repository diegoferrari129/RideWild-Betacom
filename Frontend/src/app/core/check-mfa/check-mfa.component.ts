import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CheckMfaDTO } from '../../models/customers';
import { CustomersService } from '../../services/customers.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-check-mfa',
  imports: [ReactiveFormsModule],
  templateUrl: './check-mfa.component.html',
  styleUrl: './check-mfa.component.css'
})
export class CheckMfaComponent {
  customerService = inject(CustomersService)
  router = inject(Router)
  authService = inject(AuthService)
  mfaForm = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.pattern(/^\d{6}$/)]),
  });

  onMfaSubmit(){
    //console.log('MFA Code Submitted:', this.mfaForm);
    const checkMfa: CheckMfaDTO = {
      mfaCode: this.mfaForm.value.code ?? ''
    };

    this.customerService.checkMfa(checkMfa).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);
        //console.log(response)
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.authService.logout();
        //console.error('Errore token', error.error);
      }
    })

  }
}
