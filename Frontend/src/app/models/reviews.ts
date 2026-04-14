export interface Review {
  productId: number;
  fullName: string;
  title: string;
  text: string;
  createdOn?: Date;
  rating: number;
  isPositive?: boolean;
}
