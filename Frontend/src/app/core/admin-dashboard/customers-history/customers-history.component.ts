import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { CustomerFiltered } from '../../../models/customers';
import { GoBackButtonComponent } from "../../../shared/buttons/go-back-button/go-back-button.component";

@Component({
  selector: 'app-customers-history',
  imports: [ReactiveFormsModule, CommonModule, GoBackButtonComponent],
  templateUrl: './customers-history.component.html',
  styleUrl: './customers-history.component.css'
})
export class CustomersHistoryComponent implements OnInit{
  filterForm: FormGroup;

  paginatedData: CustomerFiltered[] = [];
  totalItems = 0;

  page = 1;
  size = 10;
  maxPage = 1;

  sortField = 'firstname';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(private fb: FormBuilder, private adminService: AdminService) {
    this.filterForm = this.fb.group({
      search: [''],
    });
  }

  ngOnInit() {
    this.loadData();

    this.filterForm.get('search')!.valueChanges.subscribe(() => {
      this.page = 1;
      this.loadData();
    });
  }

  loadData() {
    const search = this.filterForm.get('search')!.value || '';
    const sort = `${this.sortField},${this.sortDirection}`;

    this.adminService.getCustomersFiltered(this.page, this.size, search, sort).subscribe(res => {
      this.paginatedData = res.data;
      this.totalItems = res.totalItems;
      this.maxPage = Math.ceil(this.totalItems / this.size);
    });
  }

  nextPage() {
    if (this.page < this.maxPage) {
      this.page++;
      this.loadData();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadData();
    }
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.page = 1;
    this.loadData();
  }
}
