import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CustomerFiltered } from '../models/customers';
import { environment } from '../../environments/environment';

interface CustomerResponse {
  data: CustomerFiltered[];
  totalItems: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;
  private http = inject(HttpClient);
  
  constructor() { }

  getCustomersFiltered(
    page: number,
    size: number,
    search: string = '',
    sort: string = 'firstname,asc'
  ): Observable<CustomerResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('search', search)
      .set('sort', sort);

    return this.http.get<CustomerResponse>(`${this.apiUrl}/get-customers-filtered`, { params });
  }
}
