import dayjs from "dayjs";

export interface OptionItem {
  label: string;
  value: number | string;
  num?: string;
  tagType?: "success" | "warning" | "danger" | "info" | "primary";
}

export interface OutformRecord {
  subcId: number;
  subcDate: string;
  subcNum: string;
  supId: number;
  supName: string;
  mateNum: string;
  mateName: string;
  number: number;
  backNumber: number;
  notbackNumber: number;
  state: string;
  remark: string;
}

export interface OutbackRecord {
  backId: number;
  backDate: string;
  backNum: string;
  outNum: string;
  supId: number;
  supName: string;
  mateNum: string;
  mateName: string;
  backNumber: number;
  badNumber: number;
  scrapNumber: number;
  state: string;
  remark: string;
}

export interface OutformPayload {
  subcDate: string;
  subcNum: string;
  supId: number;
  mateNum: string;
  number: number;
  backNumber?: number;
  state?: string;
  remark?: string;
}

export interface OutbackPayload {
  backDate: string;
  backNum: string;
  outNum: string;
  supId: number;
  mateNum: string;
  backNumber: number;
  badNumber?: number;
  scrapNumber?: number;
  state?: string;
  remark?: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  delta: string;
  tone: "blue" | "green" | "orange" | "red";
}

export interface TrendPoint {
  date: string;
  issueCount: number;
  receiptCount: number;
}

export interface SupplierRank {
  supName: string;
  pendingQty: number;
}

export interface ToolActivity {
  title: string;
  desc: string;
  time: string;
  status: string;
}

const wait = (ms = 120) => new Promise(resolve => setTimeout(resolve, ms));

export const supplierOptions: OptionItem[] = [
  { label: "华东精密", value: 1 },
  { label: "诚宇加工", value: 2 },
  { label: "锐虎机械", value: 3 },
  { label: "嘉禾五金", value: 4 }
];

export const materOptions: OptionItem[] = [
  { label: "壳体支架", value: "MAT-001", num: "MAT-001" },
  { label: "电机底座", value: "MAT-002", num: "MAT-002" },
  { label: "轴承压板", value: "MAT-003", num: "MAT-003" },
  { label: "铝合金端盖", value: "MAT-004", num: "MAT-004" },
  { label: "不锈钢卡扣", value: "MAT-005", num: "MAT-005" }
];

export const outformStateOptions: OptionItem[] = [
  { label: "待回执", value: "pending", tagType: "warning" },
  { label: "部分回执", value: "partial", tagType: "primary" },
  { label: "已回执", value: "done", tagType: "success" }
];

export const outbackStateOptions: OptionItem[] = [
  { label: "待入账", value: "received", tagType: "warning" },
  { label: "检验中", value: "inspecting", tagType: "primary" },
  { label: "已完结", value: "closed", tagType: "success" }
];

const getSupplierName = (supId: number) => supplierOptions.find(item => item.value === supId)?.label ?? "";
const getMaterName = (mateNum: string) => materOptions.find(item => item.value === mateNum)?.label ?? "";

let outformSeed = 1000;
let outbackSeed = 6000;

let outformRecords: OutformRecord[] = [
  {
    subcId: ++outformSeed,
    subcDate: "2026-04-20",
    subcNum: "WF2026042001",
    supId: 1,
    supName: "华东精密",
    mateNum: "MAT-001",
    mateName: "壳体支架",
    number: 260,
    backNumber: 120,
    notbackNumber: 140,
    state: "partial",
    remark: "首批试制"
  },
  {
    subcId: ++outformSeed,
    subcDate: "2026-04-20",
    subcNum: "WF2026042002",
    supId: 2,
    supName: "诚宇加工",
    mateNum: "MAT-002",
    mateName: "电机底座",
    number: 180,
    backNumber: 0,
    notbackNumber: 180,
    state: "pending",
    remark: "喷涂前加工"
  },
  {
    subcId: ++outformSeed,
    subcDate: "2026-04-19",
    subcNum: "WF2026041901",
    supId: 3,
    supName: "锐虎机械",
    mateNum: "MAT-003",
    mateName: "轴承压板",
    number: 320,
    backNumber: 320,
    notbackNumber: 0,
    state: "done",
    remark: "常规补货"
  },
  {
    subcId: ++outformSeed,
    subcDate: "2026-04-18",
    subcNum: "WF2026041801",
    supId: 4,
    supName: "嘉禾五金",
    mateNum: "MAT-004",
    mateName: "铝合金端盖",
    number: 150,
    backNumber: 45,
    notbackNumber: 105,
    state: "partial",
    remark: "急单插单"
  },
  {
    subcId: ++outformSeed,
    subcDate: "2026-04-18",
    subcNum: "WF2026041802",
    supId: 1,
    supName: "华东精密",
    mateNum: "MAT-005",
    mateName: "不锈钢卡扣",
    number: 600,
    backNumber: 0,
    notbackNumber: 600,
    state: "pending",
    remark: "月底备料"
  },
  {
    subcId: ++outformSeed,
    subcDate: "2026-04-17",
    subcNum: "WF2026041701",
    supId: 2,
    supName: "诚宇加工",
    mateNum: "MAT-001",
    mateName: "壳体支架",
    number: 210,
    backNumber: 210,
    notbackNumber: 0,
    state: "done",
    remark: "返工完成"
  }
];

let outbackRecords: OutbackRecord[] = [
  {
    backId: ++outbackSeed,
    backDate: "2026-04-21",
    backNum: "HZ2026042101",
    outNum: "WF2026042001",
    supId: 1,
    supName: "华东精密",
    mateNum: "MAT-001",
    mateName: "壳体支架",
    backNumber: 120,
    badNumber: 4,
    scrapNumber: 1,
    state: "inspecting",
    remark: "到货待检"
  },
  {
    backId: ++outbackSeed,
    backDate: "2026-04-20",
    backNum: "HZ2026042001",
    outNum: "WF2026041901",
    supId: 3,
    supName: "锐虎机械",
    mateNum: "MAT-003",
    mateName: "轴承压板",
    backNumber: 320,
    badNumber: 2,
    scrapNumber: 0,
    state: "closed",
    remark: "合格入库"
  },
  {
    backId: ++outbackSeed,
    backDate: "2026-04-19",
    backNum: "HZ2026041901",
    outNum: "WF2026041801",
    supId: 4,
    supName: "嘉禾五金",
    mateNum: "MAT-004",
    mateName: "铝合金端盖",
    backNumber: 45,
    badNumber: 0,
    scrapNumber: 0,
    state: "received",
    remark: "待质检"
  }
];

const paginate = <T>(list: T[], pageNum = 1, pageSize = 20) => {
  const start = (pageNum - 1) * pageSize;
  return list.slice(start, start + pageSize);
};

const includesText = (source: string | number, keyword?: string) => {
  if (!keyword) return true;
  return String(source).toLowerCase().includes(keyword.toLowerCase());
};

const inDateRange = (dateText: string, range?: string[]) => {
  if (!range || range.length !== 2) return true;
  const [start, end] = range;
  const value = dayjs(dateText);
  return value.isSame(start, "day") || value.isSame(end, "day") || (value.isAfter(start, "day") && value.isBefore(end, "day"));
};

const rebuildOutformState = (record: OutformRecord) => {
  record.notbackNumber = Math.max(record.number - record.backNumber, 0);
  if (record.backNumber <= 0) {
    record.state = "pending";
    return;
  }
  if (record.backNumber >= record.number) {
    record.state = "done";
    return;
  }
  record.state = "partial";
};

const syncOutformFromReceipts = (outNum: string, mateNum: string) => {
  const target = outformRecords.find(item => item.subcNum === outNum && item.mateNum === mateNum);
  if (!target) return;
  const totalBack = outbackRecords
    .filter(item => item.outNum === outNum && item.mateNum === mateNum)
    .reduce((sum, item) => sum + item.backNumber, 0);
  target.backNumber = totalBack;
  rebuildOutformState(target);
};

export const getOutformOptions = () => ({
  suppliers: supplierOptions,
  maters: materOptions,
  states: outformStateOptions
});

export const getOutbackOptions = () => ({
  suppliers: supplierOptions,
  maters: materOptions,
  states: outbackStateOptions,
  outNums: Array.from(new Set(outformRecords.map(item => item.subcNum))).map(value => ({ label: value, value }))
});

export const getOutformPage = async (params: Record<string, any>) => {
  await wait();
  const pageNum = Number(params.pageNum ?? 1);
  const pageSize = Number(params.pageSize ?? 20);
  const result = outformRecords
    .filter(item => includesText(item.subcNum, params.subcNum))
    .filter(item => (!params.supId ? true : item.supId === params.supId))
    .filter(item => (!params.mateNum ? true : item.mateNum === params.mateNum))
    .filter(item => (!params.state ? true : item.state === params.state))
    .filter(item => includesText(item.mateName, params.mateName))
    .filter(item => inDateRange(item.subcDate, params.subcDate))
    .sort((a, b) => dayjs(b.subcDate).valueOf() - dayjs(a.subcDate).valueOf());

  return {
    records: paginate(result, pageNum, pageSize),
    total: result.length
  };
};

export const saveOutform = async (payload: OutformPayload, editId?: number) => {
  await wait();
  const nextRecord: OutformRecord = {
    subcId: editId ?? ++outformSeed,
    subcDate: payload.subcDate,
    subcNum: payload.subcNum,
    supId: payload.supId,
    supName: getSupplierName(payload.supId),
    mateNum: payload.mateNum,
    mateName: getMaterName(payload.mateNum),
    number: Number(payload.number),
    backNumber: Number(payload.backNumber ?? 0),
    notbackNumber: 0,
    state: payload.state ?? "pending",
    remark: payload.remark ?? ""
  };
  rebuildOutformState(nextRecord);

  if (editId) {
    outformRecords = outformRecords.map(item => (item.subcId === editId ? nextRecord : item));
    return nextRecord;
  }

  outformRecords = [nextRecord, ...outformRecords];
  return nextRecord;
};

export const saveOutformBatch = async (
  header: { subcDate: string; subcNumPrefix?: string; supId: number; remark?: string },
  rows: Array<{ mateNum: string; number: number; backNumber?: number; remark?: string }>
) => {
  await wait();
  const prefix = header.subcNumPrefix || `WF${dayjs(header.subcDate).format("YYYYMMDD")}`;
  const created = rows.map((row, index) => {
    const record: OutformRecord = {
      subcId: ++outformSeed,
      subcDate: header.subcDate,
      subcNum: `${prefix}${String(index + 1).padStart(2, "0")}`,
      supId: header.supId,
      supName: getSupplierName(header.supId),
      mateNum: row.mateNum,
      mateName: getMaterName(row.mateNum),
      number: Number(row.number),
      backNumber: Number(row.backNumber ?? 0),
      notbackNumber: 0,
      state: "pending",
      remark: row.remark || header.remark || ""
    };
    rebuildOutformState(record);
    return record;
  });
  outformRecords = [...created, ...outformRecords];
  return created;
};

export const deleteOutforms = async (ids: number[]) => {
  await wait();
  const removed = outformRecords.filter(item => ids.includes(item.subcId));
  const removedKeys = new Set(removed.map(item => `${item.subcNum}__${item.mateNum}`));
  outformRecords = outformRecords.filter(item => !ids.includes(item.subcId));
  outbackRecords = outbackRecords.filter(item => !removedKeys.has(`${item.outNum}__${item.mateNum}`));
};

export const getOutbackPage = async (params: Record<string, any>) => {
  await wait();
  const pageNum = Number(params.pageNum ?? 1);
  const pageSize = Number(params.pageSize ?? 20);
  const result = outbackRecords
    .filter(item => includesText(item.backNum, params.backNum))
    .filter(item => includesText(item.outNum, params.outNum))
    .filter(item => (!params.supId ? true : item.supId === params.supId))
    .filter(item => (!params.mateNum ? true : item.mateNum === params.mateNum))
    .filter(item => (!params.state ? true : item.state === params.state))
    .filter(item => inDateRange(item.backDate, params.backDate))
    .sort((a, b) => dayjs(b.backDate).valueOf() - dayjs(a.backDate).valueOf());

  return {
    records: paginate(result, pageNum, pageSize),
    total: result.length
  };
};

export const saveOutback = async (payload: OutbackPayload, editId?: number) => {
  await wait();
  const record: OutbackRecord = {
    backId: editId ?? ++outbackSeed,
    backDate: payload.backDate,
    backNum: payload.backNum,
    outNum: payload.outNum,
    supId: payload.supId,
    supName: getSupplierName(payload.supId),
    mateNum: payload.mateNum,
    mateName: getMaterName(payload.mateNum),
    backNumber: Number(payload.backNumber),
    badNumber: Number(payload.badNumber ?? 0),
    scrapNumber: Number(payload.scrapNumber ?? 0),
    state: payload.state ?? "received",
    remark: payload.remark ?? ""
  };

  if (editId) {
    outbackRecords = outbackRecords.map(item => (item.backId === editId ? record : item));
  } else {
    outbackRecords = [record, ...outbackRecords];
  }

  const relatedOutform = outformRecords.find(item => item.subcNum === payload.outNum && item.mateNum === payload.mateNum);
  if (relatedOutform) {
    syncOutformFromReceipts(payload.outNum, payload.mateNum);
  }

  return record;
};

export const saveOutbackBatch = async (
  header: { backDate: string; backNumPrefix?: string; outNum: string; supId: number; remark?: string },
  rows: Array<{ mateNum: string; backNumber: number; badNumber?: number; scrapNumber?: number; remark?: string }>
) => {
  await wait();
  const prefix = header.backNumPrefix || `HZ${dayjs(header.backDate).format("YYYYMMDD")}`;
  const created = rows.map((row, index) => ({
    backId: ++outbackSeed,
    backDate: header.backDate,
    backNum: `${prefix}${String(index + 1).padStart(2, "0")}`,
    outNum: header.outNum,
    supId: header.supId,
    supName: getSupplierName(header.supId),
    mateNum: row.mateNum,
    mateName: getMaterName(row.mateNum),
    backNumber: Number(row.backNumber),
    badNumber: Number(row.badNumber ?? 0),
    scrapNumber: Number(row.scrapNumber ?? 0),
    state: "received",
    remark: row.remark || header.remark || ""
  }));

  created.forEach(item => {
    syncOutformFromReceipts(item.outNum, item.mateNum);
  });

  outbackRecords = [...created, ...outbackRecords];
  return created;
};

export const deleteOutbacks = async (ids: number[]) => {
  await wait();
  const removed = outbackRecords.filter(item => ids.includes(item.backId));
  outbackRecords = outbackRecords.filter(item => !ids.includes(item.backId));
  removed.forEach(item => syncOutformFromReceipts(item.outNum, item.mateNum));
};

export const getDashboardStats = async () => {
  await wait();
  const totalIssueQty = outformRecords.reduce((sum, item) => sum + item.number, 0);
  const totalBackQty = outformRecords.reduce((sum, item) => sum + item.backNumber, 0);
  const pendingQty = outformRecords.reduce((sum, item) => sum + item.notbackNumber, 0);
  const supplierCount = new Set(outformRecords.map(item => item.supId)).size;

  const cards: DashboardStat[] = [
    { label: "本月外发数量", value: String(totalIssueQty), delta: "+12.4%", tone: "blue" },
    { label: "本月回执数量", value: String(totalBackQty), delta: "+8.1%", tone: "green" },
    { label: "待回执数量", value: String(pendingQty), delta: "-5.6%", tone: "orange" },
    { label: "活跃供应商", value: String(supplierCount), delta: "+2", tone: "red" }
  ];

  const trend: TrendPoint[] = Array.from({ length: 7 }, (_, index) => {
    const date = dayjs().subtract(6 - index, "day");
    const issueCount = 80 + index * 18;
    const receiptCount = 65 + index * 15;
    return {
      date: date.format("MM-DD"),
      issueCount,
      receiptCount
    };
  });

  const supplierRank: SupplierRank[] = supplierOptions.map(item => {
    const pending = outformRecords
      .filter(record => record.supId === item.value)
      .reduce((sum, record) => sum + record.notbackNumber, 0);
    return {
      supName: item.label,
      pendingQty: pending
    };
  });

  const activities: ToolActivity[] = [
    { title: "供应商扣款模板", desc: "最近一次试跑完成，待接后端文件流接口", time: "今天 09:30", status: "待接入" },
    { title: "供应商报价导入", desc: "前端入口已预留，等你补后端后再切真实上传", time: "昨天 18:10", status: "占位中" }
  ];

  return { cards, trend, supplierRank, activities };
};
