import {NewOrderProductInfo} from "./newOrderProductInfo";

export class NewOrder {
        billToAddressId : number = 0;
        shipToAddressId : number = 0;
        shipMethod : string = "";
        freight : number = 0;
        orderDetails : NewOrderProductInfo[] = [];
}