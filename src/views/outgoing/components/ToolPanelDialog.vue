<template>
  <el-dialog v-model="visible" title="供应商工具" width="860px" :close-on-click-modal="false">
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
            <el-button type="primary" @click="openDeductionDialog()">扣款处理</el-button>
            <el-button plain @click="downloadDeductionTemplate">下载模板</el-button>
          </div>
        </el-card>

        <el-card class="tool-card" shadow="hover">
          <template #header>
            <div class="tool-card__header">
              <span>供应商扣款（含电镀费）</span>
              <el-tag type="success">可用</el-tag>
            </div>
          </template>
          <p class="tool-card__desc">沿用供应商扣款规则，无论是否退素材，均加上当前供应商、物料和工序的报价作为电镀费。</p>
          <div class="tool-card__actions">
            <el-button type="primary" @click="openDeductionDialog(true)">扣款处理</el-button>
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
          <p class="tool-card__desc">复用你原来的报价导入逻辑，继续通过现有模板和 `supWorkAddAPI` 走文件上传导入。</p>
          <div class="tool-card__actions">
            <el-button type="primary" @click="openSupWorkDialog">报价导入</el-button>
            <el-button plain @click="downloadSupWorkTemplate">下载模板</el-button>
          </div>
        </el-card>

      </div>
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

const openDeductionDialog = (includePlatingFee = false) => {
  dialogRef.value?.acceptParams({
    title: includePlatingFee ? "供应商扣款（含电镀费）" : "供应商扣款项",
    tempApi: getModel,
    importApi: (formData: FormData) => uploadDeductionFile(formData, includePlatingFee),
  });
};

const openSupWorkDialog = () => {
  dialogRef.value?.acceptParams({
    title: "供应商报价导入",
    tempApi: getSupWorkAddModel,
    importApi: supWorkAddAPI,
  });
};

const uploadDeductionFile = async (formData: FormData, includePlatingFee: boolean) => {
  const file = formData.get("file") as File | null;
  if (!file) {
    ElNotification({ title: "错误", message: "未获取到上传文件", type: "error" });
    throw new Error("file not found");
  }

  const supplierList = dictStore.dictMap.sup || [];
  const isValid = inspectFileName(file.name, supplierList as Array<{ label: string }>);

  if (!isValid) {
    ElNotification({
      title: "错误",
      message: "文件名不符合要求，扣款前必须是供应商名字",
      type: "error",
    });
    throw new Error("invalid file name");
  }

  formData.set("includePlatingFee", String(includePlatingFee));
  await useDownload(getDeductions, includePlatingFee ? "扣款（含电镀费）" : "扣款", formData);
};

const inspectFileName = (fileName: string, supplierList: Array<{ label: string }>): boolean => {
  const baseName = fileName.split(".").slice(0, -1).join(".");
  const supplierNames = supplierList.map((item) => item.label);
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

}

@media (max-width: 900px) {
  .tool-grid { grid-template-columns: 1fr; }
}
</style>
