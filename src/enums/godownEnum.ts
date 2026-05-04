import { color } from "echarts";

/**
 * @description：仓库类型常量
 */
// export const GodownTypeEnum = ["外发入库","退货入库","包装入库","包装出库","异常出库","订单出库"] as const;
export const GodownTypeMap = [
    {
        label: "外发入库",
        value: "ready_in",
        name:"未检",
        color: "#F9E076",
        tagType:"primary"
    },
    {
        label: "退货入库",
        value: "ready_in",
        name:"未检",
        color: "#F9E076",
        tagType:"primary"
    },
    {
        label: "包装入库",
        value: "end_in",
        name:"已检",
        color: "#67C23A",
        tagType:"success"
    },
    
    {
        label: "包装出库",
        value: "ready_out",
        name:"未检",
        color: "#fd7e14",
        tagType:"warning"
    },
    
    {
        label: "异常出库",
        value: "end_out",
        name:"已检",
        color: "#3B5B8E",
        tagType:"info"
    },
    {
        label: "订单出库",
        value: "end_out",
        name:"已检",
        color: "#3B5B8E",
        tagType:"info"
    },
    {
        label: "未检入库",
        value: "ready_in",
        name:"未检",
        color: "#F9E076",
        tagType:"primary"
    },
    {
        label: "未检出库",
        value: "ready_out",
        name:"未检",
        color: "#fd7e14",
        tagType:"warning"
    },
    {
        label: "已检入库",
        value: "end_in",
        name:"已检",
        color: "#67C23A",
        tagType:"success"
    },
    {
        label: "已检出库",
        value: "end_out",
        name:"已检",
        color: "#3B5B8E",
        tagType:"info"
    }

] as const;

export const typeEnum = [
    {
        label: "未检品",
        value: "ready"
    },
    {
        label: "已检品",
        value: "end"
    },]as const;

export const GodownTypeEnum = GodownTypeMap.map(item => ({
  label: item.label,
  value: item.label,
  tagType: item.tagType
}));

//快速通过lable查其他属性
export const GodownTypeObj = Object.fromEntries(
  GodownTypeMap.map(item => [item.value, item])
);