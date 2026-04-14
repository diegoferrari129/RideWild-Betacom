import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Address, CheckMfaDTO, Customer, EmailMfa, NewAddress, securityCustomer, UpdatePassword } from '../models/customers';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private apiUrl = `${environment.apiUrl}/customers`;
  private http = inject(HttpClient);

  private customerSource = new BehaviorSubject<Customer | null>(null);
  public customerSource$ = this.customerSource.asObservable();
  private customerAddresses = new BehaviorSubject<Address[] | null>(null);
  public customerAddresses$ = this.customerAddresses.asObservable();
  private securityCustomer = new BehaviorSubject<securityCustomer | null>(null);
  public securityCustomer$ = this.securityCustomer.asObservable();

  /** -------------------- GETTERS -------------------- **/

  getCustomerInfo(): Observable<Customer> {
    return this.http.get<Customer>(this.apiUrl);
  }

  getSecurityInfo(): Observable<securityCustomer> {
    return this.http.get<securityCustomer>(`${this.apiUrl}/get-security-info`);
  }

  getAddresses(): Observable<Address[]> {
    return this.http.get<Address[]>(`${this.apiUrl}/address`);
  }

  getCustomers(): Observable<Customer[]>{
    return this.http.get<Customer[]>(`${this.apiUrl}/get-all-customers`);
  }

  getCurrentSecurityCustomer(): securityCustomer | null {
    return this.securityCustomer.getValue();
  }

  getCurrentCustomer(): Customer | null {
    return this.customerSource.getValue();
  }

  getCurrentAddresses(): Address[] | null{
    return this.customerAddresses.getValue();
  }

  /** -------------------- SETTERS FOR THE STATE -------------------- **/

  setCustomer(customer: Customer): void {
    this.customerSource.next(customer);
  }

  setSecurityInfo(security: securityCustomer): void {
    this.securityCustomer.next(security);
  }

  setAddresses(addresses: Address[]): void {
    this.customerAddresses.next(addresses);
  }

  removeAddressFromState(id: number): void {
    const current = this.customerAddresses.getValue() || [];
    this.customerAddresses.next(current.filter(a => a.addressId !== id));
  }

  addAddressToState(address: Address): void {
    const current = this.customerAddresses.getValue() || [];
    this.customerAddresses.next([...current, address]);
  }

  updateAddressInState(address: Address): void {
    const current = this.customerAddresses.getValue() || [];
    this.customerAddresses.next(current.map(a => a.addressId === address.addressId ? address : a));
  }

  clearState(): void {
    this.customerSource.next(null);
    this.customerAddresses.next(null);
    this.securityCustomer.next(null);
  }

  /** -------------------- REMOTE MUTATION -------------------- **/

  updateCustomer(customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(this.apiUrl, customer);
  }

  updatePassword(updatePassword: UpdatePassword): Observable<{ message: string; token: string }> {
    return this.http.put<{ message: string; token: string }>(`${this.apiUrl}/modify-password`, updatePassword);
  }

  addAddress(address: NewAddress): Observable<Address> {
    return this.http.post<Address>(`${this.apiUrl}/address`, address);
  }

  updateAddress(address: Address): Observable<Address> {
    return this.http.put<Address>(`${this.apiUrl}/address`, address);
  }

  removeAddress(addressId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/address/${addressId}`);
  }

  /** -------------------- OTHER -------------------- **/

  checkMfa(check: CheckMfaDTO): Observable<{ message: string; token: string }> {
    return this.http.post<{ message: string; token: string }>(`${this.apiUrl}/check-mfa`, check);
  }

  requestEmailConfirmation(): Observable<{ message: string }> {
    return this.http.get<{ message: string }>(`${this.apiUrl}/confirm-email-request`);
  }

  confirmEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/confirm-email`, { token });
  }

  enableEmailMfa(emailMfa: EmailMfa): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/change-email-mfa`, emailMfa);
  }
}
