import { List } from "echarts";

export interface Project {
  id: number;
  num: string;
  name: string;
  active: number;
  custId: number;
  remark: string;
  maters: List;
}
