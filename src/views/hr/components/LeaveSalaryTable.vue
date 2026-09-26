<template>
  <div class="leave-table-scroll">
    <table class="leave-table" :class="{ worker: data.worker }" aria-label="离职工资表预览">
      <thead>
        <tr>
          <th rowspan="2">姓名</th>
          <th rowspan="2">职务</th>
          <th rowspan="2">基本工资</th>
          <th rowspan="2">应出勤小时</th>
          <template v-if="data.worker"
            ><th colspan="2">正班</th>
            <th colspan="2">平时加班</th>
            <th colspan="2">周末加班</th></template
          >
          <th v-else colspan="2">实际出勤</th>
          <th rowspan="2">法定有薪假<br />（天）</th>
          <th rowspan="2">法定节工资<br />（元）</th>
          <th rowspan="2">其他</th>
          <th rowspan="2">应发合计</th>
          <th colspan="8">扣除项目</th>
          <th rowspan="2">实发工资</th>
          <th rowspan="2">签名</th>
        </tr>
        <tr>
          <template v-if="data.worker"
            ><th>小时</th>
            <th>工资</th>
            <th>小时</th>
            <th>工资</th>
            <th>小时</th>
            <th>工资</th></template
          >
          <template v-else
            ><th>出勤小时</th>
            <th>工资</th></template
          >
          <th>社保</th>
          <th>餐费</th>
          <th>工衣</th>
          <th>罚款</th>
          <th>水电</th>
          <th>全勤</th>
          <th>其他</th>
          <th>个税</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{{ data.name }}</td>
          <td>{{ data.input.job }}</td>
          <td>{{ money(data.basicSalary) }}</td>
          <td>{{ data.input.standardHours }}</td>
          <template v-if="data.worker">
            <td>{{ data.input.normalHours }}</td>
            <td>{{ money(data.normalPay) }}</td>
            <td>{{ data.input.overtimeHours }}</td>
            <td>{{ money(data.overtimePay) }}</td>
            <td>{{ data.input.weekendHours }}</td>
            <td>{{ money(data.weekendPay) }}</td>
          </template>
          <template v-else
            ><td>{{ data.input.hours }}</td>
            <td>{{ money(data.attendancePay) }}</td></template
          >
          <td>{{ data.input.holidayDays }}</td>
          <td>{{ money(data.holidayPay) }}</td>
          <td>{{ money(data.input.otherPay) }}</td>
          <td>{{ money(data.grossPay) }}</td>
          <td>{{ money(data.social) }}</td>
          <td>{{ money(data.input.meal) }}</td>
          <td>{{ money(data.input.uniform) }}</td>
          <td>{{ money(data.input.fine) }}</td>
          <td>{{ money(data.input.utilities) }}</td>
          <td>{{ money(data.input.attendanceDeduction) }}</td>
          <td>{{ money(data.input.otherDeduction) }}</td>
          <td>{{ money(data.input.tax) }}</td>
          <td>{{ money(data.netPay) }}</td>
          <td class="signature"></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="leave-totals">
    <span>应发 {{ money(data.grossPay) }} 元</span><span>扣款 {{ money(data.deduction) }} 元</span>
    <strong>实发 {{ money(data.netPay) }} 元</strong>
  </div>
</template>

<script setup lang="ts">
import type { LeaveSalaryPreview } from "@/api/modules/leaveSalary";
defineProps<{ data: LeaveSalaryPreview }>();
const money = (value: number) => Number(value ?? 0).toFixed(2);
</script>

<style scoped>
.leave-table-scroll {
  overflow-x: auto;
}
.leave-table {
  width: 100%;
  min-width: 1250px;
  border-collapse: collapse;
  color: var(--el-text-color-primary);
  font-size: 13px;
}
.leave-table.worker {
  min-width: 1500px;
}
.leave-table th,
.leave-table td {
  border: 1px solid var(--el-text-color-regular);
  padding: 10px 5px;
  text-align: center;
  overflow-wrap: anywhere;
}
.leave-table th {
  font-weight: 500;
}
.leave-table td {
  height: 42px;
}
.signature {
  min-width: 80px;
}
.leave-totals {
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  flex-wrap: wrap;
  padding-top: 18px;
  font-size: 16px;
}
</style>
