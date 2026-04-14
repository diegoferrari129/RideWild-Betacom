import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review } from '../models/reviews';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {

  localHostReviews: string = `${environment.apiUrl}/review`;
  constructor(private http: HttpClient) { }

  
getReviewsByProductId(productId: number): Observable<Review[]> {
  return this.http.get<Review[]>(`${this.localHostReviews}/${productId}`);
}

// postReview(productId: number, review: Reviews): Observable<any> {
//   return this.http.post(`${this.localHostReviews}/${productId}/postId`, review);
// }

  postReview(review: Review): Observable<any> {
    return this.http.post(`${this.localHostReviews}/add`, review);
  }


}
