// outgoingView中的规范化接口
//number为数量，num为编号

// 外发单数据
export interface OutformData {
  //外发单id
  subcId?: number;
  //外发时间
  subcDate: Date;
  //外发单号
  subcNum?: string;
  //供应商名称
  supName: string;
  //物料编号
  materNum: number;
  //物料名称
  materName?: string;
  //外发数量
  number: number;
  //已回数量
  backNumber?: number;
  //欠料数量
  notbackNumber?: number;
  //状态
  state?: number;
  //备注
  remark: string;
  //物料
  maters?: Mates[];
  supId?: number;
}
export interface OutformDataAdd {
  //外发时间
  subcDate: Date;
  //外发单号
  subcNum?: string;
  //供应商ID
  supId: number;
  //备注
  remark: string;
  //物料
  maters: Mates[];
}
// 产品信息
export interface Custs {
  id: string;
  name: string;
  children?: Custs[];
}
// 产品级联选择
// 订单状态
export interface State {
  state: string;
  value: number;
  tagType: string;
}
//外发单新增
export interface OutformAddAsk {
  //外发时间
  subcDate: Date;
  //外发ID
  subcId: number;
  //物料
  mateList: Mates[];
  //备注
  remark: string;
}

// 回执单数据
export interface OutbackData {
  //回执单id
  backId: number;
  //回执时间
  backDate: Date;
  //外发单号
  outNum: string;
  //物料编号
  materNum: string;
  //物料名称
  materName: string;
  //回执数量
  backNumber: number;
  //备注
  remark: string;
}
// 不良以及报废数据
export interface BackbadData {
  //不良以及报废id
  backbadId: number;
  //回执时间
  backDate: Date;
  //回执单号
  backNum: string;
  //物料编号
  mateNum: string;
  //物料名称
  materName: string;
  //不良数量
  badNumber: number;
  //报废数量
  scrapNumber: number;
  //备注
  remark: string;
}

//内部数据
interface Mates {
  //物料ID
  id: number;
  //数量
  number: number;
}
