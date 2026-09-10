<template>
  <el-dialog v-model="visible" title="工资标准修改记录" width="980px" destroy-on-close>
    <div class="dialog-summary">
      <div>
        <span class="summary-label">员工</span>
        <strong>{{ employeeName }}</strong>
      </div>
      <span class="summary-count">共 {{ logs.length }} 条记录</span>
    </div>

    <el-table v-if="logs.length || loading" v-loading="loading" :data="logs" class="log-table">
      <el-table-column type="expand" width="46">
        <template #default="scope">
          <div class="record-detail">
            <div class="detail-block">
              <div class="detail-title">字段变更</div>
              <el-table :data="diffRows(scope.row.diffData)" size="small" border>
                <el-table-column prop="label" label="字段" width="150" />
                <el-table-column prop="before" label="修改前" min-width="180" show-overflow-tooltip />
                <el-table-column prop="after" label="修改后" min-width="180" show-overflow-tooltip />
              </el-table>
            </div>
            <el-collapse class="json-collapse">
              <el-collapse-item title="查看完整数据" name="json">
                <el-tabs>
                  <el-tab-pane label="修改前">
                    <pre>{{ formatJson(scope.row.beforeData) }}</pre>
                  </el-tab-pane>
                  <el-tab-pane label="修改后">
                    <pre>{{ formatJson(scope.row.afterData) }}</pre>
                  </el-tab-pane>
                </el-tabs>
              </el-collapse-item>
            </el-collapse>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="effectiveMonth" label="执行月份" width="105" />
      <el-table-column prop="changeReason" label="修改理由" min-width="180" show-overflow-tooltip />
      <el-table-column prop="supervisorOpinion" label="主管意见" min-width="160" show-overflow-tooltip />
      <el-table-column prop="approverName" label="审批人" width="100" />
      <el-table-column prop="approvalDate" label="审批日期" width="115" />
      <el-table-column prop="changeByName" label="操作人" width="100">
        <template #default="scope">{{ scope.row.changeByName || "-" }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="操作时间" width="170" />
    </el-table>

    <el-empty v-else description="暂无工资标准修改记录" :image-size="80" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { getSalaryNormLogList } from "@/api/modules/hr";
import type { SalaryNormChangeLog } from "@/api/interface/hr";
import { salaryNormFieldLabels } from "../fields";

interface DiffRow {
  field: string;
  label: string;
  before: string;
  after: string;
}

const visible = ref(false);
const loading = ref(false);
const employeeName = ref("");
const logs = ref<SalaryNormChangeLog[]>([]);

const parseJson = (value?: string): unknown => {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const diffRows = (value?: string): DiffRow[] => {
  const parsed = parseJson(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return [];
  return Object.entries(parsed).map(([field, values]: [string, any]) => ({
    field,
    label: salaryNormFieldLabels[field] || field,
    before: displayValue(values?.before ?? values?.old),
    after: displayValue(values?.after ?? values?.new)
  }));
};

const formatJson = (value?: string) => {
  const parsed = parseJson(value);
  return typeof parsed === "string" ? parsed : JSON.stringify(parsed, null, 2);
};

const open = async (salaryNormId: number, staffName: string) => {
  visible.value = true;
  employeeName.value = staffName;
  logs.value = [];
  loading.value = true;
  try {
    logs.value = (await getSalaryNormLogList(salaryNormId)).data;
  } catch {
    ElMessage.error("工资标准修改记录加载失败");
  } finally {
    loading.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped>
.dialog-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 2px 16px;
}

.summary-label {
  margin-right: 10px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.summary-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.record-detail {
  padding: 14px 22px 18px;
  background: var(--el-fill-color-lighter);
}

.detail-block {
  max-width: 760px;
}

.detail-title {
  margin-bottom: 10px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.json-collapse {
  max-width: 760px;
  margin-top: 14px;
  border-bottom: 0;
}

pre {
  max-height: 260px;
  margin: 0;
  overflow: auto;
  color: var(--el-text-color-regular);
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

:deep(.el-collapse-item__header) {
  height: 40px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

:deep(.el-collapse-item__wrap) {
  background: transparent;
}

@media (max-width: 767px) {
  .dialog-summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
}
</style>
