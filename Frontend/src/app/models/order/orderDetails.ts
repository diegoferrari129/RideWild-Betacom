import { OrderProductInfo } from "./orderProductInfo";

export class OrderDetails {
    orderId : number = 0;
    orderDate : Date = new Date();
    shipDate : Date | null = null;
    dueDate : Date = new Date();
    subTotal: number = 0;
    taxAmt: number = 0;
    freight: number = 0;
    totalDue : number = 0;
    status: number = 1;
    customerFullName: string = "";
    billAddress : string = "";
    shipAddress : string = "";
    productsInfo : OrderProductInfo[] = [];
}