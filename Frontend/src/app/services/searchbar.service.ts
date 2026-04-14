import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { ProductSearchDto } from '../models/product-search';


import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class  SearchbarService {
  localHost: string = `${environment.apiUrl}/products`;
  constructor(private http: HttpClient) { }

searchProducts(term: string) {
    const params = new HttpParams().set('q', term);
    return this.http.get<ProductSearchDto[]>(`${this.localHost}/search?${ params }`);
  }
}
