<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="980px" destroy-on-close>
    <div class="attachment-toolbar">
      <el-select
        v-model="form.category"
        class="category-select"
        filterable
        allow-create
        default-first-option
        placeholder="资料类型"
      >
        <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
      </el-select>
      <el-input v-model="form.remark" class="remark-input" clearable placeholder="备注" />
      <el-upload
        :show-file-list="false"
        :http-request="uploadFile"
        :before-upload="beforeUpload"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
      >
        <el-button type="primary" :icon="Upload" :loading="uploading">上传</el-button>
      </el-upload>
    </div>

    <el-table v-loading="loading" :data="tableData" height="430" border>
      <el-table-column prop="category" label="资料类型" width="120" show-overflow-tooltip />
      <el-table-column prop="originalName" label="文件名" min-width="240" show-overflow-tooltip />
      <el-table-column label="大小" width="100">
        <template #default="scope">{{ formatSize(scope.row.fileSize) }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="上传时间" width="170" show-overflow-tooltip />
      <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
      <el-table-column label="操作" width="190" fixed="right">
        <template #default="scope">
          <el-button v-if="canPreview(scope.row.fileType)" type="primary" link @click="previewFile(scope.row)">预览</el-button>
          <el-button type="primary" link @click="downloadFile(scope.row)">下载</el-button>
          <el-button type="danger" link @click="deleteFile(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadRawFile, UploadRequestOptions } from "element-plus";
import { Upload } from "@element-plus/icons-vue";
import { Staff, StaffAttachment } from "@/api/interface/hr";
import {
  deleteStaffAttachment,
  downloadStaffAttachment,
  getStaffAttachments,
  uploadStaffAttachment
} from "@/api/modules/hr";

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const categoryOptions = ["身份证", "劳动合同", "入职资料", "银行卡", "其他"];
const allowExts = ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"];
const previewExts = ["pdf", "jpg", "jpeg", "png"];

const visible = ref(false);
const loading = ref(false);
const uploading = ref(false);
const staff = ref<Staff>();
const tableData = ref<StaffAttachment[]>([]);
const form = reactive({
  category: "其他",
  remark: ""
});

const dialogTitle = computed(() => {
  if (!staff.value) return "人事资料";
  return `人事资料 - ${staff.value.name || staff.value.num}`;
});

const acceptParams = async (params: { row: Staff }) => {
  staff.value = params.row;
  visible.value = true;
  form.category = "其他";
  form.remark = "";
  await loadData();
};

const loadData = async () => {
  if (!staff.value?.id) return;
  loading.value = true;
  try {
    const { data } = await getStaffAttachments(staff.value.id);
    tableData.value = data || [];
  } finally {
    loading.value = false;
  }
};

const beforeUpload = (file: UploadRawFile) => {
  const ext = getExt(file.name);
  if (!allowExts.includes(ext)) {
    ElMessage.warning("仅支持 PDF、Word、Excel、JPG、PNG 文件");
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    ElMessage.warning("文件大小不能超过30MB");
    return false;
  }
  return true;
};

const uploadFile = async (options: UploadRequestOptions) => {
  if (!staff.value?.id) return;
  uploading.value = true;
  try {
    const data = new FormData();
    data.append("file", options.file);
    data.append("category", form.category || "其他");
    data.append("remark", form.remark || "");
    await uploadStaffAttachment(staff.value.id, data);
    ElMessage.success("上传成功");
    form.remark = "";
    await loadData();
    options.onSuccess?.({});
  } catch (error) {
    options.onError?.(error as any);
  } finally {
    uploading.value = false;
  }
};

const previewFile = async (row: StaffAttachment) => {
  const blob = await downloadStaffAttachment(row.id);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
};

const downloadFile = async (row: StaffAttachment) => {
  const blob = await downloadStaffAttachment(row.id);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = row.originalName || "人事资料";
  link.click();
  URL.revokeObjectURL(url);
};

const deleteFile = async (row: StaffAttachment) => {
  await ElMessageBox.confirm(`确认删除资料「${row.originalName}」?`, "提示", { type: "warning" });
  await deleteStaffAttachment(row.id);
  ElMessage.success("删除成功");
  await loadData();
};

const canPreview = (fileType?: string) => previewExts.includes((fileType || "").toLowerCase());
const getExt = (fileName: string) => fileName.split(".").pop()?.toLowerCase() || "";

const formatSize = (size?: number) => {
  if (!size) return "-";
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
};

defineExpose({
  acceptParams
});
</script>

<style scoped lang="scss">
.attachment-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.category-select {
  width: 150px;
}

.remark-input {
  flex: 1;
}
</style>
