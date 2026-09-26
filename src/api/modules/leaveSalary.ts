import http from "@/api";
import { ElMessage } from "element-plus";
import type { ResPage } from "@/api/interface";

export interface LeaveSalaryInput {
  staffId: number;
  job: string;
  standardHours: number;
  socialTier: number;
  hours: number;
  normalHours: number;
  overtimeHours: number;
  weekendHours: number;
  holidayDays: number;
  otherPay: number;
  meal: number;
  uniform: number;
  fine: number;
  utilities: number;
  attendanceDeduction: number;
  otherDeduction: number;
  tax: number;
  requestKey: string;
  previewHash?: string;
}

export interface LeaveSalaryPreview {
  input: LeaveSalaryInput;
  name: string;
  num: string;
  worker: boolean;
  basicSalary: number;
  holidayHours: number;
  normalPay: number;
  overtimePay: number;
  weekendPay: number;
  attendancePay: number;
  holidayPay: number;
  social: number;
  grossPay: number;
  deduction: number;
  netPay: number;
  previewHash: string;
}

export interface LeaveSalaryRecord {
  id: number;
  staffId: number;
  name: string;
  num: string;
  job: string;
  grossPay: number;
  deduction: number;
  netPay: number;
  createTime: string;
}

export const getLeaveStaff = (keyword = "") =>
  http.get<{ id: number; name: string; num: string }[]>("/hr/leaveSalary/staff", { keyword }, { loading: false });
export const getLeaveInitial = (staffId: number) => http.get<LeaveSalaryPreview>("/hr/leaveSalary/initial", { staffId });
export const previewLeaveSalary = (input: LeaveSalaryInput) =>
  http.post<LeaveSalaryPreview>("/hr/leaveSalary/preview", input, { loading: false, cancel: false });
export const exportLeaveSalary = (input: LeaveSalaryInput) => checkedDownload(http.download("/hr/leaveSalary/export", input));
export const saveLeaveSalary = (input: LeaveSalaryInput) =>
  http.post<LeaveSalaryRecord>("/hr/leaveSalary/save", input, { cancel: false });
export const getLeaveRecords = (params: { pageNum: number; pageSize: number; keyword: string }) =>
  http.get<ResPage<LeaveSalaryRecord>>("/hr/leaveSalary/page", params);
export const getLeaveDetail = (id: number) => http.get<LeaveSalaryPreview>("/hr/leaveSalary/detail", { id });
export const exportLeaveRecord = (id: number) => checkedDownload(http.download("/hr/leaveSalary/record/export", { id }));

async function checkedDownload(request: Promise<BlobPart>) {
  const result = await request;
  if (result instanceof Blob && result.type.includes("json")) {
    const error = JSON.parse(await result.text());
    ElMessage.error(error.message || "导出失败，请重新预览后重试");
    throw new Error(error.message || "导出失败");
  }
  return result;
}
