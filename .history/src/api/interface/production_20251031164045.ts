// @/api/interface/production.ts

/**
 * 生产记录核心数据结构（对应数据库表 production）
 */
export interface Production {
  /** 生产记录主键 */
  id?: number;
  /** 生产日期（格式：YYYY-MM-DD） */
  date: string;
  /** 产品ID(关联material.id) */
  p_id: number;
  /** 工序名 */
  process: string;
  /** 机器序号 */
  machine: string;
  /** 操作员ID(关联staff.id)，允许为null */
  operator_id?: number | null;
  /** 生产时间（小时） */
  hours: number;
  /** 生产数量 */
  qty: number;
  /** 不良品数（默认0） */
  defect?: number;
  /** 备注信息 */
  remark?: string;
  /** 创建时间（后端自动生成，前端无需传递） */
  created_at?: string;
  /** 更新时间（后端自动生成，前端无需传递） */
  updated_at?: string;
}

/**
 * 生产记录字典映射类型（用于下拉选择、数据展示等场景）
 */
export interface ProductionMap {
  /** 唯一标识（对应production.id） */
  value: number;
  /** 显示文本（通常为生产记录的关键信息组合，如“日期-产品-工序”） */
  label: string;
  /** 可选：扩展字段，用于展示更多信息 */
  [key: string]: any;
}

/**
 * 生产记录分页查询结果类型
 */
export interface ProductionPageResult {
  /** 生产记录列表 */
  records: Production[];
  /** 总条数 */
  total: number;
  /** 当前页码 */
  current: number;
  /** 每页条数 */
  size: number;
  /** 总页数 */
  pages: number;
}

/**
 * 生产记录导入结果类型
 */
export interface ProductionImportResult {
  /** 成功条数 */
  successCount: number;
  /** 失败条数 */
  failCount: number;
  /** 失败详情（可选） */
  failDetails?: Array<{
    row: number; // 行号
    reason: string; // 失败原因
  }>;
}
