<template>
  <el-drawer v-model="visible" :title="title" size="520px" :destroy-on-close="true">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="form-content" :disabled="isView">
      <el-form-item label="请购人" prop="applyUserId">
        <el-select
          v-model="form.applyUserId"
          placeholder="请选择请购人"
          :disabled="isApplyUserLocked || isView"
          filterable
          default-first-option
          style="width: 100%"
        >
          <el-option
            v-for="item in userOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="是否加急" prop="fast">
        <el-switch v-model="fastSwitch" active-text="加急" inactive-text="普通" />
      </el-form-item>

      <el-form-item label="物品名称" prop="itemName">
        <el-input v-model="form.itemName" placeholder="请输入名称" />
      </el-form-item>

      <el-form-item label="规格型号">
        <el-input v-model="form.itemSpec" placeholder="可不填" />
      </el-form-item>

      <el-form-item label="计量单位">
        <el-input v-model="form.itemUnit" placeholder="例如：个 / 包" />
      </el-form-item>

      <el-form-item label="数量" prop="itemNumber">
        <el-input-number v-model="form.itemNumber" :min="1" style="width: 100%" />
      </el-form-item>

      <el-form-item label="图片">
        <UploadImg
          v-model:imageUrl="form.fileUrl"
          :fileType="['image/jpeg', 'image/png']"
          height="200px"
          width="200px"
          :borderRadius="'10px'"
          @success="onUploadSuccess"
        />
      </el-form-item>

      <el-form-item label="申请理由">
        <el-input v-model="form.applyReason" type="textarea" placeholder="尽量填写" />
      </el-form-item>

      <el-form-item label="期望到货日期">
        <el-date-picker
          v-model="form.expectedDate"
          type="date"
          placeholder="请选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" placeholder="可不填" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" v-if="!isView" @click="submit">保存</el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import type { FormInstance } from "element-plus";
import { addPurchase, updatePurchase } from "@/api/modules/buy/officePurchase";
import { ElMessage } from "element-plus";
import UploadImg from "@/components/Upload/Img.vue";
import { useAuthStore } from "@/stores/modules/auth";
import { useDictStore } from "@/stores/modules/dict";
import type { OfficePurchase, PurchaseStatus } from "@/api/interface/buy/officePurchase";

interface FormModel {
  id?: number;
  applyUserId: number;
  userId: number;
  itemName: string;
  itemSpec: string;
  itemUnit: string;
  itemNumber: number;
  itemFileId?: number;
  fileUrl: string;
  applyReason: string;
  expectedDate: string;
  fast: number;
  remark: string;
  status?: PurchaseStatus;
  rejectReason?: string;
}

interface AcceptParams {
  title: string;
  isView: boolean;
  row: Partial<OfficePurchase>;
  canAssistApply?: boolean;
  getTableList?: () => void;
}

const dictStore = useDictStore();
const authStore = useAuthStore();

const visible = ref(false);
const title = ref("");
const isView = ref(false);
const canAssistApply = ref(false);
const getTableList = ref<any>(null);

const formRef = ref<FormInstance>();
const form = ref<FormModel>({
  id: undefined,
  applyUserId: 0,
  userId: 0,
  itemName: "",
  itemSpec: "",
  itemUnit: "",
  itemNumber: 1,
  itemFileId: undefined,
  fileUrl: "",
  applyReason: "",
  expectedDate: "",
  fast: 0,
  remark: ""
});

const fastSwitch = ref(false);
watch(fastSwitch, val => {
  form.value.fast = val ? 1 : 0;
});

const userOptions = computed(() => dictStore.dictMap["user"] || []);
const isApplyUserLocked = computed(() => !canAssistApply.value);

const rules = {
  applyUserId: [{ required: true, message: "请选择请购人", trigger: "change" }],
  itemName: [{ required: true, message: "请输入名称", trigger: "blur" }],
  itemNumber: [{ required: true, message: "请输入数量", trigger: "change" }]
};

// 初始化用户字典
onMounted(async () => {
  await dictStore.loadDicts(["user"]);
});

const resetForm = () => {
  form.value = {
    id: undefined,
    applyUserId: Number(authStore.userInfo.id || 0),
    userId: Number(authStore.userInfo.id || 0),
    itemName: "",
    itemSpec: "",
    itemUnit: "",
    itemNumber: 1,
    itemFileId: undefined,
    fileUrl: "",
    applyReason: "",
    expectedDate: "",
    fast: 0,
    remark: ""
  };
  fastSwitch.value = false;
};

// 接收父组件参数
const acceptParams = (params: AcceptParams) => {
  title.value = params.title;
  isView.value = params.isView;
  canAssistApply.value = !!params.canAssistApply;
  getTableList.value = params.getTableList;

  resetForm();

  if (params.title !== "新增") {
    Object.assign(form.value, params.row || {});
    // 兼容后端只返回 itemFileId 的情况
    if (params.row?.itemFileId && !params.row?.fileUrl) {
      form.value.fileUrl = `/api/file/download/${params.row.itemFileId}`;
    }
  }

  // userId 始终是当前用户（隐藏字段）
  form.value.userId = Number(authStore.userInfo.id || 0);

  // 没有代请购权限时，强制锁定请购人为自己
  if (!canAssistApply.value) {
    form.value.applyUserId = Number(authStore.userInfo.id || 0);
  }

  fastSwitch.value = Number(form.value.fast || 0) === 1;
  visible.value = true;
};

// 上传成功
const onUploadSuccess = (res: any) => {
  form.value.itemFileId = res?.data?.id;
  form.value.fileUrl = res?.data?.url;
};

// 保存
const submit = () => {
  formRef.value?.validate(async valid => {
    if (!valid) return;

    // 兜底：userId 永远写当前登录人
    form.value.userId = Number(authStore.userInfo.id || 0);
    // 兜底：无代请购权限强制自己
    if (!canAssistApply.value) {
      form.value.applyUserId = Number(authStore.userInfo.id || 0);
    }

    if (form.value.id) {
      await updatePurchase(form.value);
      ElMessage.success("修改成功");
    } else {
      await addPurchase(form.value);
      ElMessage.success("新增成功");
    }

    visible.value = false;
    getTableList.value?.();
  });
};

defineExpose({ acceptParams });
</script>

<style scoped>
.form-content {
  padding: 10px 20px;
}
</style>
