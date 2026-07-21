export interface Staff {
  id: number;
  num: number;
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
export interface Salary {
  id: number; hrId?: number; salaryMonth?: string; staffName?: string; workNumber?: number; way?: number;
  basicNorm?: number; overNorm?: number; standardHours?: number; workHours?: number; normalHours?: number; overHours?: number; weekOverHours?: number; leaveHours?: number; nightDays?: number;
  baseSalary?: number; overPay?: number; weekOverPay?: number; fullAttendancePay?: number; nightPay?: number; otherPay?: number; postPay?: number; bonus?: number;
  eatCutpay?: number; fixedDeduction?: number; social?: number; waterElectricDeduction?: number; otherDeduction?: number; taxDeduction?: number; attendanceDeductionHours?: number; deduction?: number; salaryTotal?: number; remark?: string;
}
export interface SalaryEditRequest extends Partial<Salary> { id: number; changeReason: string; }
export interface SalaryChangeLog { id: number; salaryId: number; salaryMonth?: string; staffName?: string; workNumber?: number; changeReason?: string; beforeData?: string; afterData?: string; diffData?: string; changeByName?: string; createTime?: string; }
export interface SalaryPageParams { pageNum: number; pageSize: number; salaryMonth?: string; staffName?: string; workNumber?: number; }

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
