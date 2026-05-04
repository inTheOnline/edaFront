export interface Order {
  orderNum: string;
  remark: string;
  custId: number;           // 客户ID
  custName: string;         // 客户名称
  createUserId: number;
  createUserName: string;
  maters: OrderMaterDetail[];
  [key: string]: any;
}
export interface OrderMaterDetail {
  id?: number;
  materId: number;
  materNum?: string;
  materName?: string;
  totalNumber: number;
  alreadyNumber?: number;
  notAlreadyNumber?: number;
  remark?: string;
}
export interface Order_mater{
    materId:number;
    totalNumber:number;
    remark:string;
}