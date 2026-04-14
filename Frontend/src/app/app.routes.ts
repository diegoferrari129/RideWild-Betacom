import { Routes } from '@angular/router';
import { HomepageComponent } from './features/homepage/homepage.component';
import { LoginComponent } from './core/login/login.component';
import { ProductsComponent } from './features/products/products.component';
import { RecoverAccountComponent } from './core/recover/recover.component';
import { UpdatePasswordComponent } from './core/update-password/update-password.component';
import { PersonalProfileComponent } from './features/personal-profile/personal-profile.component';
import { ProfileComponent } from './features/personal-profile/profile/profile.component';
import { AddressesComponent } from './features/personal-profile/addresses/addresses.component';
import { OrderHistoryComponent } from './features/personal-profile/order-history/order-history.component';
import { PaymentMethodsComponent } from './features/personal-profile/payment-methods/payment-methods.component';
import { CartComponent } from './features/cart/cart.component';
import { ResetPSWComponent } from './core/reset-psw/reset-psw.component';
import { CheckoutComponent } from './core/checkout/checkout.component';
import { ChangeSecurityComponent } from './features/personal-profile/change-security/change-security.component';
import { ConfirmEmailComponent } from './core/confirm-email/confirm-email.component';
import { CheckMfaComponent } from './core/check-mfa/check-mfa.component';
import { AuthGuardCustomer } from './guards/authCustomer.guard';
import { SuccessComponent } from './core/success/success.component';
import { ProductDetailsComponent } from './features/products/details/details.component';
import { AdminDashboardComponent } from './core/admin-dashboard/admin-dashboard.component';
import { CustomersHistoryComponent } from './core/admin-dashboard/customers-history/customers-history.component';
import { AuthGuardAdmin } from './guards/authAdmin.guards';
import { AdminChatComponent } from './core/admin-chat/admin-chat.component';
import { CustomerChatComponent } from './core/customer-chat/customer-chat.component';
import { OrdersComponent } from './core/admin-dashboard/orders/orders.component';
import { OrderDetailsComponent } from './features/order-details/order-details.component';
import { ProductsHistoryComponent } from './core/admin-dashboard/products-history/products-history.component';
import { ProductAdminDetailsComponent } from './core/admin-dashboard/products-history/product-admin-details/product-admin-details.component';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'products', component: ProductsComponent },
  { path: 'products/:id', component: ProductDetailsComponent },
  { path: 'recover', component: RecoverAccountComponent },
  { path: 'update-password', component: UpdatePasswordComponent },
  { path: 'cart', component: CartComponent },
  { path: 'reset-password', component: ResetPSWComponent },
  {
    path: 'confirm-email',
    component: ConfirmEmailComponent,
    canActivate: [AuthGuardCustomer],
  },
  { path: 'check-mfa', component: CheckMfaComponent },
  {
    path: 'personal-profile',
    component: PersonalProfileComponent,
    canActivate: [AuthGuardCustomer],
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'profile', component: ProfileComponent },
      { path: 'addresses', component: AddressesComponent },
      { path: 'order-history', component: OrderHistoryComponent },
      { path: 'payment-methods', component: PaymentMethodsComponent },
      { path: 'change-security', component: ChangeSecurityComponent },
      { path: 'threads', component: CustomerChatComponent },
      { path: 'products-history', component: ProductsHistoryComponent },
    ],
  },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuardCustomer] },
  { path: 'success', component: SuccessComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent },
  {
    path: 'admin-dashboard/customers-history',
    component: CustomersHistoryComponent,
    canActivate: [AuthGuardAdmin],
  },
  {
    path: 'admin-dashboard/threads',
    component: AdminChatComponent,
    canActivate: [AuthGuardAdmin],
  },

  { path: 'admin-dashboard/orders', component: OrdersComponent },
  { path: 'admin-dashboard/orders/:id', component: OrderDetailsComponent },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search-results/search-results.component')
        .then(c => c.SearchResultsComponent)
  },
  {
    path: 'admin-dashboard/orders',
    component: OrdersComponent,
    canActivate: [AuthGuardAdmin],
  },
  {
    path: 'admin-dashboard/orders/:id',
    component: OrderDetailsComponent,
    canActivate: [AuthGuardAdmin],
  },
  {
    path: 'admin-dashboard/products-history',
    component: ProductsHistoryComponent,
    canActivate: [AuthGuardAdmin],
  },
  {
    path: 'admin-dashboard/products-history/product-admin-details/:id',
    component: ProductAdminDetailsComponent,
    canActivate: [AuthGuardAdmin],
  }
];