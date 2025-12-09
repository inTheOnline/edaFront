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
      <el-form-item label="请购人" prop="materId">
        <el-select 
          v-model="form.applyUserId" 
          placeholder="选择或输入产品" 
          :disabled="controlPower"
          filterable   
          default-first-option  
        >
          <el-option 
            v-for="item in drawerProps.materialList" 
            :key="item.value" 
            :value="item.value" 
          />
        </el-select>
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
        <el-input-number v-model="form.itemNumber" :min="1" />
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
        <el-input
          v-model="form.applyReason"
          type="textarea"
          placeholder="尽量填写"
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

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          placeholder="可不填"
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
import {
  addPurchase,
  updatePurchase
} from "@/api/modules/buy/officePurchase";
import { ElMessage } from "element-plus";
import UploadImg from "@/components/Upload/Img.vue";
import { useUserStore } from "@/stores/modules/user";
import { useDictStore } from "@/stores/modules/dist";

const dictStore = useDictStore();
const visible = ref(false);
const controlPower = ref(false);
const title = ref("");
const isView = ref(false);
const getTableList = ref<any>(null);

const userStore = useUserStore();

const formRef = ref<FormInstance>();
const form = ref({
  id: null, // 主键 ID
  applyUserId: null, // 自动填充当前用户
  itemName: "",
  itemSpec: "",
  itemUnit: "",
  itemNumber: 1,
  itemFileId: null,
  fileUrl: "", // 仅用于前端显示
  applyReason: "",
  expectedDate: "",
  remark: ""
});

const rules = {
  itemName: [{ required: true, message: "请输入名称" }],
  itemNumber: [{ required: true, message: "请输入数量" }]
};

// 接收父组件参数
const acceptParams = (params) => {
  title.value = params.title;
  isView.value = params.isView;
  getTableList.value = params.getTableList;

  // 当前用户作为申请人
  form.value.applyUserId = userStore.userInfo.id;

  if (params.title === "新增") {
    Object.assign(form.value, {
      id: null,
      applyUserId: userStore.userInfo.id,
      itemName: "",
      itemSpec: "",
      itemUnit: "",
      itemNumber: 1,
      itemFileId: null,
      fileUrl: "",
      applyReason: "",
      expectedDate: "",
      remark: ""
    });
  } else {
    // 编辑 or 查看
    Object.assign(form.value, params.row);

    // 如果后端只给了 itemFileId，需要拼接 fileUrl
    if (params.row.itemFileId) {
      form.value.fileUrl = `/api/file/download/${params.row.itemFileId}`;
    }
  }

  visible.value = true;
};

// 上传成功
const onUploadSuccess = (res) => {
  form.value.itemFileId = res.data.id;
  form.value.fileUrl = res.data.url;
};

// 保存
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;

    if (form.value.id) {
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
