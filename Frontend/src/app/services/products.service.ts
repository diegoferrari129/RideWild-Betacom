import { Injectable } from '@angular/core';
// per far partire le api devo importare il modulo HttpClientModule
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ProductsResponse } from '../models/products'; // adjust the path as needed
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})


export class ProductsService {

  // localhostProducts è l'url del server locale
  localHostProducts: string = `${environment.apiUrl}/products`;
  constructor(private http: HttpClient) { }

  // GetProducts() è un metodo che restituisce la lista dei prodotti
  // Dopo devo agiungere il richiamo di questa funzione in products.component.ts
  GetProducts(page: number = 1, pageSize: number = 15) {
    return this.http.get<any[]>(
      `${this.localHostProducts}?page=${page}&pageSize=${pageSize}`
    );
  }

  GetProductsOrderedByPrice(page: number = 1, pageSize: number = 15, order: string = 'asc'): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.localHostProducts}/OrderedByPrice?page=${page}&pageSize=${pageSize}&sortOrder=${order}`
    );
  }

  GetProductsByNewest(page: number = 1, pageSize: number = 15, order: string = 'asc'): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.localHostProducts}/OrderedByNewest?page=${page}&pageSize=${pageSize}&sortOrder=${order}`
    );
  }

  //TODO: ----------------------------------------
  GetProductsByNewestAdmin(page: number = 1, pageSize: number = 20) {
    return this.http.get<ProductsResponse>(
      `${this.localHostProducts}/OrderedByNewestAdmin?page=${page}&pageSize=${pageSize}`
    );
  }

  // TODO: CATEGORIE
  getCategories() {
    return this.http.get<any[]>(`${this.localHostProducts}/Categories`);
  }

  getModels() {
    return this.http.get<any[]>(`${this.localHostProducts}/Models`);
  }

  GetProductByCategory(categoryIds: number[]): Observable<any[]> {
    // If your API expects a comma-separated string:
    const params = categoryIds.map(id => `categoryIds=${id}`).join('&');
    return this.http.get<any[]>(`${this.localHostProducts}/Bycategory?${params}`);
  }

  GetBestsellers(page: number = 1, pageSize: number = 15): Observable<any[]> {
    return this.http.get<any[]>(`${this.localHostProducts}/bestseller?page=${page}&pageSize=${pageSize}`);
  }
  GetProductById(id: number): Observable<any> {
    return this.http.get<any>(`${this.localHostProducts}/byId/${id}`);
  }

  //! DELETE PRODUCT
  DeleteProduct(id: number) {
    return this.http.delete<any>(`${this.localHostProducts}/${id}`);
  }

  // TODO: ---------------------------------------- ADD PRODUCTS
  AddProduct(product: any) {
    return this.http.post<any>(this.localHostProducts, product);
  }

  // TODO: ---------------------------------------- UPDATE PRODUCTS
  UpdateProduct(id: number, product: any) {
    return this.http.put<any>(`${this.localHostProducts}/${id}`, product);
  }
}