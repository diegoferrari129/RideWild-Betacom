import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recover-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recover.component.html',
  styleUrl: './recover.component.css'
})
export class RecoverAccountComponent {
  inputValue: string = '';
  constructor(private authService: AuthService, public router: Router) { }


  onSubmit() {
    this.authService.recoverPsw(this.inputValue).subscribe({})
    Swal.fire({
      icon: 'warning',
      title: ['Controlla la tua email per il link di recupero.'],
      confirmButtonColor: '#013220df'
    })
  }
}
