<template>
  <el-dialog
    v-model="visible"
    title="供应商工具"
    width="860px"
    :close-on-click-modal="false"
  >
    <div class="tool-panel">
      <div class="tool-grid">
        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="tool-card__header">
              <span>供应商扣款处理</span>
              <el-tag type="success">可用</el-tag>
            </div>
          </template>
          <p class="tool-card__desc">
            复用你原来已经可用的扣款模板流程：下载模板、上传文件、校验“供应商名 + 扣款”命名，再回传结果文件。
          </p>
          <div class="tool-card__actions">
            <el-button type="primary" @click="openDeductionDialog">扣款处理</el-button>
            <el-button plain @click="downloadDeductionTemplate">下载模板</el-button>
          </div>
        </el-card>

        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="tool-card__header">
              <span>供应商报价导入</span>
              <el-tag type="success">可用</el-tag>
            </div>
          </template>
          <p class="tool-card__desc">
            复用你原来的报价导入逻辑，继续通过现有模板和 `supWorkAddAPI` 走文件上传导入。
          </p>
          <div class="tool-card__actions">
            <el-button type="primary" @click="openSupWorkDialog">报价导入</el-button>
            <el-button plain @click="downloadSupWorkTemplate">下载模板</el-button>
          </div>
        </el-card>

        <el-card class="tool-card tool-card--empty" shadow="never">
          <div class="tool-card__placeholder">
            <span>更多工具位</span>
            <small>这里继续放你的外发工具</small>
          </div>
        </el-card>
      </div>

      <el-card class="activity-card" shadow="never">
        <template #header>
          <div class="tool-card__header">
            <span>最近工具动态</span>
            <small>这里仍然保留展示区</small>
          </div>
        </template>
        <div class="activity-list">
          <div v-for="item in activities" :key="item.title" class="activity-item">
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.desc }}</p>
            </div>
            <div class="activity-meta">
              <span>{{ item.time }}</span>
              <el-tag type="info">{{ item.status }}</el-tag>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <ImportExcel ref="dialogRef" />
  </el-dialog>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElNotification } from "element-plus";
import ImportExcel from "@/components/ImportExcel/index.vue";
import { useDownload } from "@/hooks/useDownload";
import { getDeductions, getModel, getSupWorkAddModel, supWorkAddAPI } from "@/api/modules/outgoing";
import { useDictStore } from "@/stores/modules/dict";
import type { ToolActivity } from "../mock";

defineProps<{
  activities: ToolActivity[];
}>();

const visible = ref(false);
const dialogRef = ref<InstanceType<typeof ImportExcel> | null>(null);
const dictStore = useDictStore();

onMounted(async () => {
  await dictStore.loadDicts(["sup"]);
});

const open = () => {
  visible.value = true;
};

const downloadDeductionTemplate = () => {
  useDownload(getModel, "供应商扣款模板");
};

const downloadSupWorkTemplate = () => {
  useDownload(getSupWorkAddModel, "供应商报价导入模板");
};

const openDeductionDialog = () => {
  dialogRef.value?.acceptParams({
    title: "供应商扣款项",
    tempApi: getModel,
    importApi: uploadDeductionFile
  });
};

const openSupWorkDialog = () => {
  dialogRef.value?.acceptParams({
    title: "供应商报价导入",
    tempApi: getSupWorkAddModel,
    importApi: supWorkAddAPI
  });
};

const uploadDeductionFile = async (formData: FormData) => {
  const file = formData.get("file") as File | null;
  if (!file) {
    ElNotification({ title: "错误", message: "未获取到上传文件", type: "error" });
    throw new Error("file not found");
  }

  const supplierList = dictStore.dictMap.sup || [];
  const isValid = inspectFileName(
    file.name,
    supplierList as Array<{ label: string }>
  );

  if (!isValid) {
    ElNotification({
      title: "错误",
      message: "文件名不符合要求，扣款前必须是供应商名字",
      type: "error"
    });
    throw new Error("invalid file name");
  }

  useDownload(getDeductions, "扣款", formData);
};

const inspectFileName = (
  fileName: string,
  supplierList: Array<{ label: string }>
): boolean => {
  const baseName = fileName.split(".").slice(0, -1).join(".");
  const supplierNames = supplierList.map(item => item.label);
  const hasValidStructure = /^.+扣款.+$/.test(baseName);

  if (!hasValidStructure) return false;

  const nameBeforeDeduction = baseName.split("扣款")[0];
  return supplierNames.includes(nameBeforeDeduction);
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.tool-panel {
  display: grid;
  gap: 16px;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.tool-card {
  min-height: 220px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__desc {
    min-height: 66px;
    margin: 0 0 16px;
    color: #606266;
    line-height: 1.6;
  }

  &__actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  &--empty {
    border: 1px dashed #dcdfe6;
    background: linear-gradient(135deg, #f8fafc 0%, #eef5ff 100%);
  }

  &__placeholder {
    display: grid;
    place-items: center;
    min-height: 170px;
    color: #909399;
    text-align: center;
    gap: 8px;
  }
}

.activity-card {
  border: 1px solid #ebeef5;
}

.activity-list {
  display: grid;
  gap: 12px;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid #f1f3f5;

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }

  p {
    margin: 6px 0 0;
    color: #606266;
  }
}

.activity-meta {
  display: grid;
  justify-items: end;
  gap: 8px;
  color: #909399;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }

  .activity-item {
    flex-direction: column;
  }

  .activity-meta {
    justify-items: start;
  }
}
</style>
