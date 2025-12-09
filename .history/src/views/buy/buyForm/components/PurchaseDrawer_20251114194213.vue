<template>
  <el-drawer
    v-model="visible"
    :title="title"
    size="500px"
    :destroy-on-close="true"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="form-content"
      :disabled="isView"
    >
      <el-form-item label="用品名称" prop="itemName">
        <el-input v-model="form.itemName" placeholder="请输入名称" />
      </el-form-item>

      <el-form-item label="规格型号">
        <el-input v-model="form.itemSpec" placeholder="可不填" />
      </el-form-item>

      <el-form-item label="计量单位">
        <el-input v-model="form.itemUnit" placeholder="例如：个 / 包" />
      </el-form-item>

      <el-form-item label="数量" prop="itemNumber">
        <el-input-number
          v-model="form.itemNumber"
          :min="1"
          @change="calcTotal"
        />
      </el-form-item>

      <el-form-item label="单价(元)" prop="itemPrice">
        <el-input-number
          v-model="form.itemPrice"
          :min="0"
          :step="0.1"
          @change="calcTotal"
        />
      </el-form-item>

      <el-form-item label="总金额">
        <el-input v-model="form.totalAmount" disabled />
      </el-form-item>

      <el-form-item label="图片">
        <el-upload
          class="upload-demo"
          action="/api/file/upload"
          :show-file-list="false"
          :on-success="onUploadSuccess"
        >
          <img
            v-if="form.fileUrl"
            :src="form.fileUrl"
            style="width: 80px; height: 80px; border-radius: 8px"
          />
          <el-icon v-else><Plus /></el-icon>
        </el-upload>
      </el-form-item>

      <el-form-item label="申请理由">
        <el-input
          v-model="form.applyReason"
          type="textarea"
          rows="3"
          placeholder="可选填"
        />
      </el-form-item>

      <el-form-item label="期望到货日期">
        <el-date-picker
          v-model="form.expectedDate"
          type="date"
          placeholder="请选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" v-if="!isView" @click="submit">
        保存
      </el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FormInstance } from "element-plus";
import { addPurchase, updatePurchase } from "@/api/modules/buy";
import { ElMessage } from "element-plus";

const visible = ref(false);
const title = ref("");
const isView = ref(false);
const getTableList = ref<any>(null);

const formRef = ref<FormInstance>();
const form = ref({
  purchaseId: null,
  itemName: "",
  itemSpec: "",
  itemUnit: "",
  itemNumber: 1,
  itemPrice: 0,
  totalAmount: 0,
  fileId: null,
  fileUrl: "",
  applyReason: "",
  expectedDate: ""
});

const rules = {
  itemName: [{ required: true, message: "请输入名称" }],
  itemNumber: [{ required: true, message: "请输入数量" }],
  itemPrice: [{ required: true, message: "请输入单价" }]
};

// 接收父组件参数
const acceptParams = (params) => {
  title.value = params.title;
  isView.value = params.isView;
  getTableList.value = params.getTableList;

  if (params.title === "新增") {
    Object.assign(form.value, {
      purchaseId: null,
      itemName: "",
      itemSpec: "",
      itemUnit: "",
      itemNumber: 1,
      itemPrice: 0,
      totalAmount: 0,
      fileId: null,
      fileUrl: "",
      applyReason: "",
      expectedDate: ""
    });
  } else {
    Object.assign(form.value, params.row);
  }

  calcTotal();
  visible.value = true;
};

// 上传成功
const onUploadSuccess = (res) => {
  form.value.fileId = res.data.id;
  form.value.fileUrl = res.data.url;
};

// 自动计算总金额
const calcTotal = () => {
  form.value.totalAmount = Number(
    (form.value.itemNumber * form.value.itemPrice).toFixed(2)
  );
};

// 保存
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;

    if (form.value.purchaseId) {
      await updatePurchase(form.value);
      ElMessage.success("修改成功");
    } else {
      await addPurchase(form.value);
      ElMessage.success("新增成功");
    }

    visible.value = false;
    getTableList.value();
  });
};

defineExpose({ acceptParams });
</script>

<style scoped>
.form-content {
  padding: 10px 20px;
}
</style>
