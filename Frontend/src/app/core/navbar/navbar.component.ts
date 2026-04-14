import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProductsService } from '../../services/products.service';
import { Subscription } from 'rxjs';
declare var bootstrap: any;

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [FormsModule, NgIf, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  showSearch = false;
  searchText = '';
  showDropdown = false;
  closeTimeout: any;
  dropdownCloseTimeout: any;
  cartCount: number = 0;
  selectedTab: 'login' | 'register' = 'login';
  isLogged = false;
  isAdmin = false;

  private loginSub!: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private cartService: CartService,
    private route: ActivatedRoute,
    private productService: ProductsService
  ) {}

  ngOnInit(): void {
    this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    this.route.queryParams.subscribe(params => {
      const tipo = params['tipo'];
      this.selectedTab = tipo === 'login' ? 'login' : 'register';
    });

    this.loginSub = this.authService.loginState$.subscribe(() => {
      this.updateLoginState();
    });

    this.updateLoginState();
  }

  private updateLoginState(): void {
    this.isLogged = this.authService.isLoggedIn();
    this.isAdmin = this.authService.isAdminLoggedIn();
  }

  ngOnDestroy(): void {
    this.loginSub?.unsubscribe();
  }

  cancelCloseSearch() {
    this.showSearch = true;
    if (this.closeTimeout) {
      clearTimeout(this.closeTimeout);
    }
  }

  scheduleCloseSearch() {
    this.closeTimeout = setTimeout(() => {
      this.showSearch = false;
    }, 300);
  }

  openDropdown() {
    clearTimeout(this.dropdownCloseTimeout);
    this.showDropdown = true;
  }

  closeDropdown() {
    this.dropdownCloseTimeout = setTimeout(() => {
      this.showDropdown = false;
    }, 300);
  }

  logout() {
    this.authService.logout();
    this.cartService.counter();
    this.router.navigate(['/']);
  }

  closeMobileMenu() {
    const element = document.getElementById('navbarSupportedContent');
    if (element?.classList.contains('show')) {
      const collapse = new bootstrap.Collapse(element, { toggle: false });
      collapse.hide();
    }
  }

  onSearch(): void {
    const term = this.searchText.trim();
    if (!term) return;

    this.router.navigate(['/search'], { queryParams: { q: term } });
    this.closeMobileMenu();
    this.searchText = '';
  }
}
