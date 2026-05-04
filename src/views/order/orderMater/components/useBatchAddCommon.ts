/**
 * 批量添加 Dialog 公共逻辑封装
 *
 * 使用说明：
 * 1. 在组件中引入：import { useBatchAddCommon } from "./useBatchAddCommon"
 * 2. 在 setup 中调用：const { form, rules, methods } = useBatchAddCommon(props)
 * 3. 将 template 中的表单和表格绑定到 form.records
 * 4. 调用 methods.submit() 进行提交
 *
 * 新增内容：我添加了这个新文件，原始 BatchAddDialog 组件代码未改动
 */

import { ref, reactive, watch } from "vue";
import { ElMessage } from "element-plus";

// ====================== 类型定义 ======================

export interface MaterItem {
  value: number;
  label: string;
  num?: string;
}

export interface BatchRecord {
  custOrderId: number | null;
  materId?: string | number;
  materNum?: string | number;
  orderId?: number | null;
  materName?: string;
  orderNum?: string;
  number: number | null;
  remark: string;
  notAlreadyNumber: number | null;
}

export interface BatchForm {
  date: string;
  num?: string; // 出货单号（orderOut 使用）
  orderNum?: string; // 订单号（orderMater 使用）
  records: BatchRecord[];
}

export type BatchMode = "withOrder" | "withoutOrder";

export interface UseBatchAddProps {
  mode: BatchMode; // 初始模式
  materList?: MaterItem[]; // 物料列表
  getTableList?: () => void; // 刷新表格方法
  submitApi: (payload: any[]) => Promise<any>; // 提交接口
  dateFieldLabel?: string; // 日期字段标签（默认："出货日期"）
  numFieldLabel?: string; // 单号字段标签（默认："送货单号"）
}

// ====================== 获取今日日期 ======================

const getToday = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// ====================== 核心 Hook ======================

export const useBatchAddCommon = (props: UseBatchAddProps) => {
  // 响应式状态
  const visible = ref(false);
  const mode = ref<BatchMode>(props.mode);
  const materList = ref<MaterItem[]>(props.materList || []);
  let getTableList: (() => void) | null = null;

  // 表单数据
  const form = reactive<BatchForm>({
    date: getToday(),
    num: "",
    orderNum: "",
    records: [],
  });

  // 表单校验规则
  const rules = {
    date: [{ required: true, message: `请选择${props.dateFieldLabel || "日期"}` }],
    num: [{ required: true, message: `请输入${props.numFieldLabel || "单号"}` }],
    orderNum: [{ required: true, message: "请输入订单号" }],
  };

  // ====================== 公共方法 ======================

  // 打开弹窗
  const open = (params?: { materList?: MaterItem[]; getTableList?: () => void }) => {
    visible.value = true;
    materList.value = params?.materList || props.materList || [];
    getTableList = params?.getTableList || props.getTableList || null;

    // 重置表单
    form.date = getToday();
    form.num = "";
    form.orderNum = "";
    form.records = [];
    addRow();
  };

  // 添加一行
  const addRow = () => {
    form.records.push({
      custOrderId: null,
      materId: "",
      materNum: "",
      orderId: null,
      materName: "",
      orderNum: "",
      number: null,
      remark: "",
      notAlreadyNumber: null,
    });
  };

  // 删除一行
  const removeRow = (index: number) => {
    form.records.splice(index, 1);
  };

  // 数量输入限制（订单模式下，不能超过 notAlreadyNumber）
  const handleNumberInput = (row: BatchRecord) => {
    if (mode.value === "withoutOrder" || !row.notAlreadyNumber) return;
    if (row.number > row.notAlreadyNumber) {
      row.number = row.notAlreadyNumber;
      ElMessage.warning(`最多可开单数量：${row.notAlreadyNumber}`);
    }
  };

  // 模式切换：清空无关字段
  const onModeChange = watch(mode, (newMode) => {
    form.records.forEach((row) => {
      if (newMode === "withOrder") {
        row.materId = "";
      } else {
        row.custOrderId = null;
        row.orderNum = "";
        row.materName = "";
        row.materNum = "";
      }
    });
  });

  // 禁止未来日期
  const disabledFutureDate = (time: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return time.getTime() > today.getTime();
  };

  // 行数据校验
  const validateRecords = (): boolean => {
    if (!form.records.length) {
      ElMessage.warning("请添加至少一条记录");
      return false;
    }
    for (let i = 0; i < form.records.length; i++) {
      const r = form.records[i];
      if (!r.number || r.number <= 0) {
        ElMessage.warning(`第 ${i + 1} 行数量无效`);
        return false;
      }
      if (mode.value === "withOrder") {
        if (!r.custOrderId) {
          ElMessage.warning(`第 ${i + 1} 行未选择订单条目`);
          return false;
        }
        if (r.number > (r.notAlreadyNumber || 0)) {
          ElMessage.warning(`第 ${i + 1} 行数量不能超过可开单数量：${r.notAlreadyNumber}`);
          return false;
        }
      } else {
        if (!r.materId) {
          ElMessage.warning(`第 ${i + 1} 行未选择产品`);
          return false;
        }
      }
    }
    return true;
  };

  // 构造提交参数
  const buildPayload = () => {
    return form.records.map((r) => {
      if (mode.value === "withOrder") {
        return {
          custOrderId: r.custOrderId,
          totalNumber: r.number,
          remark: r.remark,
          localTime: form.date,
          orderNum: form.orderNum || r.orderNum,
          materNum: r.materNum,
          materName: r.materName,
        };
      } else {
        return {
          materId: r.materId,
          totalNumber: r.number,
          remark: r.remark,
          localTime: form.date,
          num: form.num,
        };
      }
    });
  };

  // 提交保存（带 loading 和错误处理）
  const submit = async () => {
    if (!validateRecords()) return;

    const loading = ElLoading.service({ text: "提交中..." });
    try {
      await props.submitApi(buildPayload());
      ElMessage.success("批量添加成功！");
      visible.value = false;
      getTableList?.();
    } catch (error) {
      ElMessage.error("提交失败，请检查数据");
      console.error("Batch submit failed:", error);
    } finally {
      loading.close();
    }
  };

  // 暴露给 template 的方法
  const exposed = {
    open,
    addRow,
    removeRow,
    handleNumberInput,
    disabledFutureDate,
    submit,
    form,
    rules,
    mode,
    materList,
  };

  return {
    visible,
    ...exposed,
  };
};
