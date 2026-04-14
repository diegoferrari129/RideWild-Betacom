import { OrderDetails } from "./orderDetails";

export class Order {
    salesOrderId : number = 0;
    orderDate : Date = new Date();
    totalDue: number = 0;
    status: string = "";
}