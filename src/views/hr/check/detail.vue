<template>
  <div class="attendance-page" v-loading="loading">
    <header class="page-header">
      <div>
        <div class="breadcrumb">考勤管理 / 考勤明细</div>
        <h1>{{ title }}</h1>
      </div>
      <div class="header-actions">
        <el-button :icon="Upload" @click="openAttendanceImport">导入考勤</el-button>
        <el-button :icon="Coin" @click="openSalaryCalculate">计算工资</el-button>
        <el-button type="primary" :icon="Plus" @click="openLeave">登记请假</el-button>
      </div>
    </header>

    <section class="filters">
      <el-date-picker v-model="selectedMonth" type="month" value-format="YYYY-MM" :clearable="false" @change="changeMonth" />
      <el-input v-model="query.keyword" placeholder="姓名 / 工号" clearable :prefix-icon="Search" @keyup.enter="search" />
      <el-select v-model="query.departmentId" placeholder="全部部门" clearable @change="search">
        <el-option v-for="item in departments" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <div class="abnormal-switch">
        <span>仅看异常</span>
        <el-switch v-model="query.onlyAbnormal" @change="search" />
      </div>
      <el-button type="primary" :icon="Search" @click="search">查询</el-button>
      <el-button :icon="Refresh" @click="reset">重置</el-button>
    </section>

    <section class="summary-grid">
      <button v-for="item in summaryCards" :key="item.key" class="summary-card" type="button" @click="filterByCard(item.key)">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>人</small>
        <el-icon :class="item.tone"><component :is="item.icon" /></el-icon>
      </button>
    </section>

    <section class="matrix-card">
      <div class="matrix-toolbar">
        <div>
          <strong>月度考勤矩阵</strong>
          <span>点击每日状态可查看并人工修正</span>
        </div>
        <div class="legend" aria-label="考勤状态图例">
          <span v-for="item in statusOptions" :key="item.value"><i :class="`status-${item.value.toLowerCase()}`">{{ item.short }}</i>{{ item.label }}</span>
        </div>
      </div>

      <el-table :data="rows" border stripe height="calc(100vh - 405px)" row-key="staffId">
        <el-table-column prop="num" label="工号" width="82" fixed="left" />
        <el-table-column prop="name" label="姓名" width="90" fixed="left" />
        <el-table-column prop="departmentName" label="部门" width="100" fixed="left" />
        <el-table-column
          v-for="day in daysInMonth"
          :key="day"
          :label="String(day)"
          width="48"
          align="center"
          :class-name="isWeekend(day) ? 'weekend-column' : ''"
          :label-class-name="isWeekend(day) ? 'weekend-column' : ''"
        >
          <template #default="scope">
            <button
              v-if="scope.row.days[day - 1]"
              type="button"
              class="status-cell"
              :class="`status-${scope.row.days[day - 1].status.toLowerCase()}`"
              :title="`${scope.row.days[day - 1].date} ${scope.row.days[day - 1].statusLabel}`"
              @click="openDay(scope.row, scope.row.days[day - 1])"
            >
              {{ statusShort(scope.row.days[day - 1].status) }}
            </button>
          </template>
        </el-table-column>
        <el-table-column prop="workingHours" label="出勤" width="76" fixed="right" align="center" />
        <el-table-column label="加班" width="76" fixed="right" align="center">
          <template #default="scope">{{ formatHours((scope.row.overHours || 0) + (scope.row.weekOverHours || 0)) }}</template>
        </el-table-column>
        <el-table-column prop="abnormalCount" label="异常" width="68" fixed="right" align="center">
          <template #default="scope"><span :class="{ 'abnormal-count': scope.row.abnormalCount }">{{ scope.row.abnormalCount }}</span></template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <span>共 {{ total }} 人</span>
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          layout="sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @current-change="loadData"
          @size-change="search"
        />
      </div>
    </section>

    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="420px" destroy-on-close>
      <div v-if="activeDay" class="day-detail">
        <div class="detail-status">
          <span>当前状态</span>
          <b :class="`status-${activeDay.status.toLowerCase()}`">{{ activeDay.statusLabel }}</b>
          <small v-if="activeDay.source === 'MANUAL'">人工修正</small>
        </div>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="员工">{{ activeRow?.name }}（{{ activeRow?.num }}）</el-descriptions-item>
          <el-descriptions-item label="部门">{{ activeRow?.departmentName }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ activeDay.date }}</el-descriptions-item>
          <el-descriptions-item label="规定时间">08:00-12:00、13:20-{{ activeDay.scheduledEnd }}</el-descriptions-item>
          <el-descriptions-item label="打卡记录">
            <div v-if="activeDay.times.length" class="punch-list">
              <span v-for="(time, index) in activeDay.times" :key="`${time}-${index}`">第{{ index + 1 }}次 {{ time }}</span>
            </div>
            <span v-else>无打卡记录</span>
          </el-descriptions-item>
        </el-descriptions>
        <el-divider content-position="left">人工修正</el-divider>
        <el-form label-position="top">
          <el-form-item label="考勤状态">
            <el-select v-model="adjustment.status" class="full-width">
              <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="adjustment.status === 'LEAVE'" label="请假时间">
            <el-date-picker
              v-model="leaveRange"
              type="datetimerange"
              value-format="YYYY-MM-DDTHH:mm:ss"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              class="full-width"
            />
          </el-form-item>
          <el-form-item label="修正原因"><el-input v-model="adjustment.reason" placeholder="请输入修正原因" /></el-form-item>
          <el-form-item label="备注"><el-input v-model="adjustment.remark" type="textarea" :rows="3" /></el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="drawerVisible = false">关闭</el-button>
        <el-button type="primary" :loading="saving" @click="saveAdjustment">保存修正</el-button>
      </template>
    </el-drawer>

    <el-dialog v-model="leaveVisible" title="登记请假" width="520px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="员工">
          <el-select v-model="leaveForm.staffId" filterable class="full-width" placeholder="请选择员工">
            <el-option v-for="staff in staffOptions" :key="staff.id" :label="`${staff.name}（${staff.num}）`" :value="staff.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="请假时间">
          <el-date-picker v-model="leaveForm.range" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss" class="full-width" />
        </el-form-item>
        <el-form-item label="请假原因"><el-input v-model="leaveForm.reason" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="leaveForm.remark" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="leaveVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveLeave">保存</el-button>
      </template>
    </el-dialog>

    <ImportExcel ref="attendanceImportRef" />
    <ImportExcel ref="salaryImportRef" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Coin, Refresh, Search, Upload, Plus, User, Timer, Warning, Calendar, CircleClose } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import ImportExcel from "@/components/ImportExcel/index.vue";
import {
  addManyCheck,
  calculateSalary,
  getAll,
  getAttendancePage,
  getCheckModel,
  getMonths,
  getSalaryTemplate,
  saveAttendanceAdjustment
} from "@/api/modules/hr";
import { getDepartmentApi } from "@/api/modules/department";
import type { AttendanceAdjustmentRequest, AttendanceDay, AttendanceRow, AttendanceStatus, Staff } from "@/api/interface/hr";

const route = useRoute();
const router = useRouter();
const now = new Date();
const initialYear = Number(route.query.year) || now.getFullYear();
const initialMonth = Number(route.query.month) || now.getMonth() + 1;
const selectedMonth = ref(`${initialYear}-${String(initialMonth).padStart(2, "0")}`);
const loading = ref(false);
const saving = ref(false);
const rows = shallowRef<AttendanceRow[]>([]);
const total = ref(0);
const departments = ref<Array<{ id: number; name: string }>>([]);
const staffOptions = ref<Staff[]>([]);
const summary = reactive({ staffCount: 0, late: 0, early: 0, missing: 0, leave: 0, abnormal: 0 });
const query = reactive({ pageNum: 1, pageSize: 20, keyword: "", departmentId: undefined as number | undefined, onlyAbnormal: false });
const attendanceImportRef = ref<InstanceType<typeof ImportExcel>>();
const salaryImportRef = ref<InstanceType<typeof ImportExcel>>();
const drawerVisible = ref(false);
const leaveVisible = ref(false);
const activeRow = ref<AttendanceRow>();
const activeDay = ref<AttendanceDay>();
const leaveRange = ref<string[]>([]);
const adjustment = reactive<AttendanceAdjustmentRequest>({ staffId: 0, status: "NORMAL", reason: "", remark: "" });
const leaveForm = reactive<{ staffId?: number; range: string[]; reason: string; remark: string }>({ range: [], reason: "", remark: "" });

const statusOptions: Array<{ value: AttendanceStatus; label: string; short: string }> = [
  { value: "NORMAL", label: "正常", short: "√" },
  { value: "LATE", label: "迟到", short: "迟" },
  { value: "EARLY", label: "早退", short: "退" },
  { value: "LATE_EARLY", label: "迟到/早退", short: "迟退" },
  { value: "MISSING", label: "缺卡", short: "缺" },
  { value: "LEAVE", label: "请假", short: "假" },
  { value: "REST", label: "休息", short: "休" },
  { value: "ABSENT", label: "旷工", short: "旷" }
];
const summaryCards = computed(() => [
  { key: "staffCount", label: "考勤人数", value: summary.staffCount, icon: User, tone: "blue" },
  { key: "late", label: "迟到", value: summary.late, icon: Timer, tone: "orange" },
  { key: "early", label: "早退", value: summary.early, icon: Timer, tone: "amber" },
  { key: "missing", label: "缺卡", value: summary.missing, icon: CircleClose, tone: "red" },
  { key: "leave", label: "请假", value: summary.leave, icon: Calendar, tone: "purple" },
  { key: "abnormal", label: "异常人数", value: summary.abnormal, icon: Warning, tone: "red" }
]);
const currentYear = computed(() => Number(selectedMonth.value.split("-")[0]));
const currentMonth = computed(() => Number(selectedMonth.value.split("-")[1]));
const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value, 0).getDate());
const title = computed(() => `${currentYear.value}年${currentMonth.value}月考勤明细`);
const drawerTitle = computed(() => `${activeRow.value?.name || ""} · ${currentMonth.value}月${activeDay.value?.day || ""}日`);

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await getAttendancePage({ year: currentYear.value, month: currentMonth.value, ...query });
    rows.value = data.records;
    total.value = data.total;
    Object.assign(summary, data.summary);
  } finally {
    loading.value = false;
  }
};
const search = () => { query.pageNum = 1; loadData(); };
const reset = () => { query.keyword = ""; query.departmentId = undefined; query.onlyAbnormal = false; search(); };
const changeMonth = () => {
  router.replace({ path: route.path, query: { year: currentYear.value, month: currentMonth.value } });
  search();
};
const filterByCard = (key: string) => {
  if (key !== "abnormal") return;
  query.onlyAbnormal = true;
  search();
};
const isWeekend = (day: number) => [0, 6].includes(new Date(currentYear.value, currentMonth.value - 1, day).getDay());
const statusShort = (status: AttendanceStatus) => statusOptions.find(item => item.value === status)?.short || "-";
const formatHours = (value: number) => Number(value || 0).toFixed(1);

const openDay = (row: AttendanceRow, day: AttendanceDay) => {
  activeRow.value = row;
  activeDay.value = day;
  Object.assign(adjustment, { staffId: row.staffId, attendanceDate: day.date, status: day.status, reason: day.reason || "", remark: day.remark || "" });
  leaveRange.value = day.leaveStart && day.leaveEnd ? [day.leaveStart, day.leaveEnd] : [];
  drawerVisible.value = true;
};
const saveAdjustment = async () => {
  if (!adjustment.reason?.trim()) return ElMessage.warning("请填写修正原因");
  if (adjustment.status === "LEAVE" && leaveRange.value.length !== 2) return ElMessage.warning("请选择请假时间");
  saving.value = true;
  try {
    await saveAttendanceAdjustment({
      ...adjustment,
      leaveStart: adjustment.status === "LEAVE" ? leaveRange.value[0] : undefined,
      leaveEnd: adjustment.status === "LEAVE" ? leaveRange.value[1] : undefined
    });
    ElMessage.success("考勤记录已修正");
    drawerVisible.value = false;
    await loadData();
  } finally { saving.value = false; }
};
const openLeave = async () => {
  if (!staffOptions.value.length) staffOptions.value = (await getAll({ pageNum: 1, pageSize: 1000 })).data.records;
  leaveForm.staffId = undefined;
  leaveForm.range = [];
  leaveForm.reason = "";
  leaveForm.remark = "";
  leaveVisible.value = true;
};
const saveLeave = async () => {
  if (!leaveForm.staffId || leaveForm.range.length !== 2 || !leaveForm.reason.trim()) return ElMessage.warning("请完整填写员工、请假时间和原因");
  saving.value = true;
  try {
    await saveAttendanceAdjustment({ staffId: leaveForm.staffId, status: "LEAVE", leaveStart: leaveForm.range[0], leaveEnd: leaveForm.range[1], reason: leaveForm.reason, remark: leaveForm.remark });
    ElMessage.success("请假记录已保存");
    leaveVisible.value = false;
    await loadData();
  } finally { saving.value = false; }
};

const downloadBlob = (result: unknown, fileName: string) => {
  const blob = result instanceof Blob ? result : new Blob([result as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
const importAttendance = async (params: FormData) => {
  const result = await addManyCheck(params);
  const { url, fileName } = result.data;
  if (url) {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "考勤.xlsx";
    link.click();
  }
  await loadData();
  return result;
};
const calculateAndDownload = async (params: FormData) => {
  const result = await calculateSalary(params);
  if (result instanceof Blob && result.type.includes("application/json")) {
    const error = JSON.parse(await result.text());
    ElMessage.error(error.message || "工资计算失败");
    throw error;
  }
  downloadBlob(result, `${selectedMonth.value}工资明细.xlsx`);
  ElMessage.success("工资计算完成，明细已下载");
  return result;
};
const openAttendanceImport = () => attendanceImportRef.value?.acceptParams({ title: "员工考勤数据", tempApi: getCheckModel, importApi: importAttendance, getTableList: loadData });
const openSalaryCalculate = () => salaryImportRef.value?.acceptParams({ title: "工资计算导入", tempApi: getSalaryTemplate, importApi: calculateAndDownload });

onMounted(async () => {
  if (!route.query.year || !route.query.month) {
    const { data: months } = await getMonths();
    const latest = [...(months as string[])].sort((a, b) => {
      const [aYear, aMonth] = a.split(".").map(Number);
      const [bYear, bMonth] = b.split(".").map(Number);
      return bYear * 12 + bMonth - (aYear * 12 + aMonth);
    })[0];
    if (latest) {
      const [latestYear, latestMonth] = latest.split(".");
      selectedMonth.value = `${latestYear}-${latestMonth.padStart(2, "0")}`;
      await router.replace({ path: route.path, query: { year: latestYear, month: latestMonth } });
    }
  }
  const [{ data }] = await Promise.all([getDepartmentApi(), loadData()]);
  departments.value = data as unknown as Array<{ id: number; name: string }>;
});
</script>

<style lang="scss" scoped>
.attendance-page { min-height: 100%; padding: 18px; background: #f5f7fa; color: #1f2937; }
.page-header, .filters, .matrix-toolbar, .pagination-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.page-header { margin-bottom: 14px; }
.breadcrumb { margin-bottom: 4px; color: #909399; font-size: 13px; }
h1 { margin: 0; font-size: 22px; font-weight: 650; }
.header-actions { display: flex; gap: 8px; }
.filters { justify-content: flex-start; padding: 12px; margin-bottom: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
.filters :deep(.el-input), .filters :deep(.el-select) { width: 190px; }
.abnormal-switch { display: flex; align-items: center; gap: 10px; padding: 0 8px; white-space: nowrap; }
.summary-grid { display: grid; grid-template-columns: repeat(6, minmax(130px, 1fr)); gap: 10px; margin-bottom: 12px; }
.summary-card { position: relative; min-height: 82px; padding: 14px 16px; overflow: hidden; text-align: left; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; cursor: default; }
.summary-card:last-child { cursor: pointer; }
.summary-card span { display: block; margin-bottom: 6px; color: #6b7280; }
.summary-card strong { font-size: 26px; line-height: 1; }
.summary-card small { margin-left: 4px; color: #9ca3af; }
.summary-card .el-icon { position: absolute; top: 27px; right: 16px; font-size: 27px; }
.blue { color: #2563eb; }.orange { color: #f97316; }.amber { color: #d97706; }.red { color: #dc2626; }.purple { color: #7c3aed; }
.matrix-card { overflow: hidden; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
.matrix-toolbar { padding: 12px 14px; border-bottom: 1px solid #e5e7eb; }
.matrix-toolbar strong { margin-right: 12px; }.matrix-toolbar > div > span { color: #909399; font-size: 13px; }
.legend { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; }
.legend span { display: inline-flex; align-items: center; gap: 4px; color: #606266; font-size: 12px; }
.legend i { min-width: 21px; height: 21px; padding: 0 3px; line-height: 21px; text-align: center; font-style: normal; border-radius: 4px; }
.status-cell { width: 30px; min-height: 28px; padding: 0 2px; background: transparent; border: 0; border-radius: 4px; cursor: pointer; }
.status-cell:hover, .status-cell:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
.status-normal { color: #16a34a; }.status-late, .status-early, .status-late_early { color: #ea580c; background: #fff7ed; }
.status-missing, .status-absent { color: #dc2626; background: #fef2f2; }.status-leave { color: #7c3aed; background: #f5f3ff; }.status-rest { color: #9ca3af; }
.abnormal-count { color: #dc2626; font-weight: 650; }
.pagination-bar { padding: 12px 14px; }.pagination-bar > span { color: #606266; font-size: 13px; }
.detail-status { display: flex; align-items: center; gap: 10px; padding: 12px; margin-bottom: 16px; background: #f8fafc; border-radius: 8px; }
.detail-status b { padding: 4px 9px; border-radius: 5px; }.detail-status small { color: #2563eb; }
.punch-list { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }.full-width { width: 100%; }
:deep(.weekend-column) { background: #f5f7fa !important; }
:deep(.el-table .cell) { padding: 0 6px; white-space: nowrap; }
@media (max-width: 1200px) { .summary-grid { grid-template-columns: repeat(3, 1fr); }.page-header { align-items: flex-start; }.filters { flex-wrap: wrap; } }
</style>
