export interface Order{
    orderNum:string;//订单编号
    remark:string;
    custName:number;
    createUserName:number;
    maters:Order_mater[];
}
export interface Order_mater{
    materId:number;
    totalNumber:number;
    remark:string;
}