<template>
  <n-card title="工具栏" class="leave-toolbar">
    <el-space wrap>
      <el-button type="primary" @click="openCalculator">人员离职工资计算</el-button>
      <el-button @click="openRecords">离职员工工资记录</el-button>
      <NetworkTool />
    </el-space>
  </n-card>
  <el-dialog
    v-model="visible"
    title="人员离职工资计算"
    width="96%"
    top="4vh"
    destroy-on-close
    :close-on-click-modal="false"
    :close-on-press-escape="!saving"
    :show-close="!saving"
  >
    <el-form label-position="top" :disabled="saving">
      <div class="leave-form-grid">
        <el-form-item label="职员">
          <el-select
            v-model="staffId"
            filterable
            remote
            :remote-method="searchStaff"
            :loading="searching"
            placeholder="输入姓名或工号"
            @change="selectStaff"
          >
            <el-option
              v-for="staff in staffOptions"
              :key="staff.id"
              :value="staff.id"
              :label="`${staff.name}（${staff.num || '无工号'}）`"
            />
          </el-select>
        </el-form-item>
        <template v-if="form && initial">
          <el-form-item label="职务"><el-input v-model="form.job" maxlength="100" placeholder="手动填写" /></el-form-item>
          <el-form-item label="基本工资（元）"><el-input :model-value="initial.basicSalary.toFixed(2)" disabled /></el-form-item>
          <el-form-item label="应出勤小时">
            <el-select v-model="form.standardHours" :disabled="initial.worker">
              <el-option v-if="initial.worker" :value="176" label="176（普工）" />
              <template v-else
                ><el-option :value="208" label="208（月薪）" /><el-option :value="260" label="260（月薪）"
              /></template>
            </el-select>
          </el-form-item>
          <template v-for="field in attendanceFields" :key="field.key">
            <el-form-item :label="field.label"
              ><el-input-number v-model="form[field.key]" :min="0" :max="99999999.99" :precision="2" :controls="false"
            /></el-form-item>
          </template>
          <el-form-item label="法定有薪假（天）"
            ><el-input-number v-model="form.holidayDays" :min="0" :max="99999999.99" :precision="2" :controls="false"
          /></el-form-item>
          <el-form-item label="其他应发（元）"
            ><el-input-number v-model="form.otherPay" :min="0" :max="99999999.99" :precision="2" :controls="false"
          /></el-form-item>
          <el-form-item label="是否购买社保">
            <div class="leave-social">
              <el-switch :model-value="form.socialTier !== 0" aria-label="是否购买社保" @change="toggleSocial" />
              <el-select v-if="form.socialTier !== 0" v-model="form.socialTier" aria-label="社保档位">
                <el-option :value="1" label="深圳一档" /><el-option :value="2" label="深圳二档" />
              </el-select>
              <span v-else>未购买</span>
            </div>
          </el-form-item>
        </template>
      </div>
      <template v-if="form && initial">
        <p class="leave-hint">
          有薪假折算：普工、208小时月薪每天8小时；260小时月薪每天10小时。出勤工时不含有薪假，假期工资单列，不重复计薪。
        </p>
        <el-divider content-position="left">扣除项目（元）</el-divider>
        <div class="leave-deductions">
          <el-form-item v-for="field in deductionFields" :key="field.key" :label="field.label">
            <el-input-number v-model="form[field.key]" :min="0" :max="99999999.99" :precision="2" :controls="false" />
          </el-form-item>
        </div>
      </template>
    </el-form>
    <div v-if="form" class="leave-preview" v-loading="calculating">
      <div class="leave-preview-title">
        <h3>工资表预览</h3>
        <span>导出 Excel 与此表一致</span>
      </div>
      <el-alert v-if="previewError" :title="previewError" type="error" :closable="false" />
      <LeaveSalaryTable v-if="preview && !previewError" :data="preview" />
    </div>
    <el-empty v-else :description="selecting ? '正在读取职员工资标准…' : '请选择职员，读取工资标准'" />
    <template #footer>
      <div class="leave-footer">
        <span class="leave-hint">仅点击保存后写入离职员工工资记录；导出、取消或关闭均不保存。</span>
        <el-space
          ><el-button type="primary" plain :disabled="!ready || saving" :loading="exporting" @click="download"
            >导出 Excel</el-button
          >
          <el-button :disabled="saving" @click="visible = false">取消</el-button>
          <el-button type="primary" :disabled="!ready || exporting" :loading="saving" @click="save">保存</el-button></el-space
        >
      </div>
    </template>
  </el-dialog>

  <el-dialog v-model="recordsVisible" title="离职员工工资记录" width="90%" top="6vh" destroy-on-close>
    <el-form inline @submit.prevent="searchRecords">
      <el-form-item label="姓名 / 工号"
        ><el-input v-model="keyword" clearable placeholder="输入姓名或工号" @keyup.enter="searchRecords"
      /></el-form-item>
      <el-form-item><el-button type="primary" @click="searchRecords">查询</el-button></el-form-item>
    </el-form>
    <el-table :data="records" border v-loading="recordsLoading">
      <el-table-column prop="num" label="工号" min-width="90" /><el-table-column prop="name" label="姓名" min-width="100" />
      <el-table-column prop="job" label="职务" min-width="100" />
      <el-table-column v-for="column in recordMoneyColumns" :key="column.key" :label="column.label" min-width="110" align="right">
        <template #default="scope">{{ Number(scope.row[column.key]).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="保存时间" min-width="175" />
      <el-table-column label="操作" width="140" fixed="right"
        ><template #default="scope">
          <el-button link type="primary" @click="viewRecord(scope.row)">查看</el-button>
          <el-button link type="primary" @click="downloadRecord(scope.row)">导出</el-button>
        </template></el-table-column
      >
    </el-table>
    <el-pagination
      v-model:current-page="pageNum"
      :page-size="20"
      :total="total"
      layout="total, prev, pager, next"
      class="leave-pagination"
      @current-change="loadRecords"
    />
  </el-dialog>
  <el-dialog v-model="detailVisible" title="离职工资记录详情" width="96%" top="10vh" destroy-on-close>
    <template v-if="detail">
      <p class="leave-hint">保存时的结算内容；后续职员资料、工资标准和社保金额变更不影响本记录。</p>
      <LeaveSalaryTable :data="detail" />
    </template>
    <template #footer
      ><el-button v-if="detailRecord" type="primary" @click="downloadRecord(detailRecord)">导出 Excel</el-button
      ><el-button @click="detailVisible = false">关闭</el-button></template
    >
  </el-dialog>
</template>

<script setup lang="ts">
import NetworkTool from "./NetworkTool.vue";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useDownload } from "@/hooks/useDownload";
import {
  getLeaveStaff,
  getLeaveInitial,
  previewLeaveSalary,
  exportLeaveSalary,
  saveLeaveSalary,
  getLeaveRecords,
  getLeaveDetail,
  exportLeaveRecord,
} from "@/api/modules/leaveSalary";
import type { LeaveSalaryInput, LeaveSalaryPreview, LeaveSalaryRecord } from "@/api/modules/leaveSalary";
import LeaveSalaryTable from "./LeaveSalaryTable.vue";

type NumberKey =
  | "hours"
  | "normalHours"
  | "overtimeHours"
  | "weekendHours"
  | "meal"
  | "uniform"
  | "fine"
  | "utilities"
  | "attendanceDeduction"
  | "otherDeduction"
  | "tax";
const deductionFields: { key: NumberKey; label: string }[] = [
  { key: "meal", label: "餐费" },
  { key: "uniform", label: "工衣" },
  { key: "fine", label: "罚款" },
  { key: "utilities", label: "水电" },
  { key: "attendanceDeduction", label: "全勤扣款" },
  { key: "otherDeduction", label: "其他扣款" },
  { key: "tax", label: "个税" },
];
const recordMoneyColumns = [
  { key: "grossPay", label: "应发合计" },
  { key: "deduction", label: "扣款合计" },
  { key: "netPay", label: "实发工资" },
];
const visible = ref(false),
  saving = ref(false),
  exporting = ref(false),
  calculating = ref(false),
  selecting = ref(false);
const staffId = ref<number>();
const staffOptions = ref<{ id: number; name: string; num: string }[]>([]);
const searching = ref(false);
const form = ref<LeaveSalaryInput>();
const initial = ref<LeaveSalaryPreview>();
const preview = ref<LeaveSalaryPreview>();
const previewError = ref("");
let previewVersion = 0,
  selectionVersion = 0,
  searchVersion = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const attendanceFields = computed<{ key: NumberKey; label: string }[]>(() =>
  initial.value?.worker
    ? [
        { key: "normalHours", label: "正班（小时）" },
        { key: "overtimeHours", label: "平时加班（小时）" },
        { key: "weekendHours", label: "周末加班（小时）" },
      ]
    : [{ key: "hours", label: "实际出勤（小时）" }],
);
const ready = computed(() => !!preview.value && !calculating.value && !selecting.value && !previewError.value);

async function searchStaff(keyword = "") {
  const version = ++searchVersion;
  searching.value = true;
  try {
    const { data } = await getLeaveStaff(keyword);
    if (version === searchVersion) staffOptions.value = data;
  } finally {
    if (version === searchVersion) searching.value = false;
  }
}
function reset() {
  ++selectionVersion;
  ++previewVersion;
  clearTimeout(timer);
  form.value = undefined;
  initial.value = undefined;
  preview.value = undefined;
  staffId.value = undefined;
  previewError.value = "";
  calculating.value = false;
  selecting.value = false;
}
async function openCalculator() {
  reset();
  visible.value = true;
  await searchStaff();
}
async function selectStaff(id: number) {
  const version = ++selectionVersion;
  ++previewVersion;
  clearTimeout(timer);
  form.value = undefined;
  preview.value = undefined;
  initial.value = undefined;
  selecting.value = true;
  try {
    const { data } = await getLeaveInitial(id);
    if (version !== selectionVersion || !visible.value) return;
    initial.value = data;
    form.value = { ...data.input };
  } finally {
    if (version === selectionVersion) selecting.value = false;
  }
}
function toggleSocial(enabled: string | number | boolean) {
  if (form.value) form.value.socialTier = enabled ? 2 : 0;
}
watch(
  form,
  () => {
    const version = ++previewVersion;
    clearTimeout(timer);
    previewError.value = "";
    if (!form.value || !visible.value) {
      calculating.value = false;
      return;
    }
    calculating.value = true;
    timer = setTimeout(async () => {
      try {
        const { data } = await previewLeaveSalary({ ...form.value! });
        if (version === previewVersion) preview.value = data;
      } catch {
        if (version === previewVersion) {
          preview.value = undefined;
          previewError.value = "预览失败，请检查输入或重新选择职员后重试。";
        }
      } finally {
        if (version === previewVersion) calculating.value = false;
      }
    }, 250);
  },
  { deep: true, flush: "sync" },
);
watch(visible, (value) => {
  if (!value) reset();
});
onBeforeUnmount(reset);
function checkedInput() {
  return { ...form.value!, previewHash: preview.value!.previewHash };
}
async function download() {
  if (!ready.value || exporting.value) return;
  exporting.value = true;
  try {
    await useDownload(exportLeaveSalary, `离职工资-${preview.value!.name}`, checkedInput(), false);
  } finally {
    exporting.value = false;
  }
}
async function save() {
  if (!ready.value || saving.value) return;
  saving.value = true;
  try {
    await saveLeaveSalary(checkedInput());
    ElMessage.success("已保存到离职员工工资记录");
    visible.value = false;
  } finally {
    saving.value = false;
  }
}

const recordsVisible = ref(false),
  recordsLoading = ref(false),
  detailVisible = ref(false);
const records = ref<LeaveSalaryRecord[]>([]),
  total = ref(0),
  pageNum = ref(1),
  keyword = ref("");
const detail = ref<LeaveSalaryPreview>(),
  detailRecord = ref<LeaveSalaryRecord>();
let recordsVersion = 0;
async function openRecords() {
  recordsVisible.value = true;
  await searchRecords();
}
async function searchRecords() {
  pageNum.value = 1;
  await loadRecords();
}
async function loadRecords() {
  const version = ++recordsVersion;
  recordsLoading.value = true;
  try {
    const { data } = await getLeaveRecords({ pageNum: pageNum.value, pageSize: 20, keyword: keyword.value });
    if (version === recordsVersion) {
      records.value = data.records;
      total.value = data.total;
    }
  } finally {
    if (version === recordsVersion) recordsLoading.value = false;
  }
}
async function viewRecord(record: LeaveSalaryRecord) {
  const { data } = await getLeaveDetail(record.id);
  detail.value = data;
  detailRecord.value = record;
  detailVisible.value = true;
}
async function downloadRecord(record: LeaveSalaryRecord) {
  await useDownload(exportLeaveRecord, `离职工资-${record.name}`, record.id, false);
}
</script>

<style scoped>
.leave-toolbar {
  margin-bottom: 16px;
}
.leave-form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0 24px;
}
.leave-deductions {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 16px;
}
.leave-form-grid :deep(.el-input-number),
.leave-deductions :deep(.el-input-number),
.leave-form-grid :deep(.el-select) {
  width: 100%;
}
.leave-social {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.leave-hint {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}
.leave-preview {
  border-top: 1px solid var(--el-border-color);
  margin-top: 8px;
  padding-top: 8px;
  min-height: 120px;
}
.leave-preview-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.leave-preview-title span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.leave-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  text-align: left;
}
.leave-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
@media (max-width: 1000px) {
  .leave-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .leave-deductions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .leave-form-grid,
  .leave-deductions {
    grid-template-columns: 1fr;
  }
}
</style>
