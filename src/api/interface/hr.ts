export interface Staff {
  id: number;
  num: string;
  name: string;
  age: number;
  sex: number;
  departmentId:number;
  state: number;
  idCard: string;
  live: string;
  phone: string;
  edu: string;
  social?: number;
  bankCard?: string;
  bankBranch?: string;
  bankDetail?: string;
  remark?: string;
}

export interface SalaryNorm { id?: number; staffId?: number; basicNorm?: number; overNorm?: number; nightNorm?: number; otherNorm?: number; postNorm?: number; bonus?: number; eatCutpay?: number; fixedDeduction?: number; social?: number; remark?: string; }
export interface SalaryNormEditRequest extends Omit<Partial<SalaryNorm>, "staffId"> {
  id: number;
  changeReason: string;
  effectiveMonth: string;
  supervisorOpinion: string;
  approverName: string;
  approvalDate: string;
}
export interface SalaryNormChangeLog {
  id: number;
  salaryNormId: number;
  staffId: number;
  changeReason: string;
  effectiveMonth: string;
  supervisorOpinion: string;
  approverName: string;
  approvalDate: string;
  beforeData?: string;
  afterData?: string;
  diffData?: string;
  changeById?: number;
  changeByName?: string;
  createTime?: string;
}
export interface SalaryNormLogPageParams {
  pageNum: number;
  pageSize: number;
  salaryNormId?: number;
  staffId?: number;
  effectiveMonth?: string;
  approverName?: string;
  changeByName?: string;
}
export interface Salary {
  id: number; hrId?: number; salaryMonth?: string; staffName?: string; workNumber?: string; way?: number;
  basicNorm?: number; overNorm?: number; standardHours?: number; workHours?: number; normalHours?: number; overHours?: number; weekOverHours?: number; leaveHours?: number; nightDays?: number;
  baseSalary?: number; overPay?: number; weekOverPay?: number; fullAttendancePay?: number; nightPay?: number; otherPay?: number; postPay?: number; bonus?: number;
  eatCutpay?: number; fixedDeduction?: number; social?: number; waterElectricDeduction?: number; otherDeduction?: number; taxDeduction?: number; attendanceDeductionHours?: number; deduction?: number; salaryTotal?: number; remark?: string;
}
export interface SalaryEditRequest extends Partial<Salary> { id: number; changeReason: string; }
export interface SalaryChangeLog { id: number; salaryId: number; salaryMonth?: string; staffName?: string; workNumber?: string; changeReason?: string; beforeData?: string; afterData?: string; diffData?: string; changeByName?: string; createTime?: string; }
export interface SalaryPageParams { pageNum: number; pageSize: number; salaryMonth?: string; staffName?: string; workNumber?: string; }

export interface StaffAttachment {
  id: number;
  staffId: number;
  category?: string;
  originalName: string;
  storedName: string;
  filePath: string;
  fileType?: string;
  fileSize?: number;
  remark?: string;
  createTime?: string;
  createUserId?: number;
}

export type AttendanceStatus = "NORMAL" | "LATE" | "EARLY" | "LATE_EARLY" | "MISSING" | "LEAVE" | "REST" | "ABSENT";
export interface AttendanceDay {
  date: string;
  day: number;
  status: AttendanceStatus;
  statusLabel: string;
  times: string[];
  scheduledEnd: string;
  source: "SYSTEM" | "MANUAL";
  reason?: string;
  remark?: string;
  leaveStart?: string;
  leaveEnd?: string;
}
export interface AttendanceRow {
  id: number;
  staffId: number;
  num: string;
  name: string;
  departmentId: number;
  departmentName: string;
  workingHours?: number;
  overHours?: number;
  weekOverHours?: number;
  abnormalCount: number;
  days: AttendanceDay[];
}
export interface AttendancePage {
  records: AttendanceRow[];
  total: number;
  summary: { staffCount: number; late: number; early: number; missing: number; leave: number; abnormal: number };
}
export interface AttendanceAdjustmentRequest {
  staffId: number;
  attendanceDate?: string;
  status: AttendanceStatus;
  leaveStart?: string;
  leaveEnd?: string;
  reason?: string;
  remark?: string;
}
