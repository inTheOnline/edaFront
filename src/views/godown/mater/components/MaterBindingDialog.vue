<template>
  <el-dialog v-model="visible" title="主产品与插件关系" width="760px" :close-on-click-modal="false">
    <el-table v-loading="loading" :data="records" border stripe max-height="420" empty-text="暂无绑定关系">
      <el-table-column prop="mainMaterNum" label="主产品料号" min-width="150" />
      <el-table-column prop="mainMaterName" label="主产品名称" min-width="160" />
      <el-table-column prop="pluginMaterNum" label="插件料号" min-width="150" />
      <el-table-column prop="pluginMaterName" label="插件名称" min-width="160" />
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click="edit(row)">修改</el-button>
          <el-button type="danger" link @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-button type="primary" plain class="add-button" @click="edit()">新增绑定关系</el-button>

    <el-dialog v-model="editing" title="绑定插件产品" width="560px" append-to-body :close-on-click-modal="false">
      <el-alert title="插件只随主产品计算原材料，不能在快速请购中主动选择。" type="info" show-icon :closable="false" />
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="binding-form">
        <el-form-item label="主产品" prop="mainMaterId">
          <el-select v-model="form.mainMaterId" filterable placeholder="请选择主产品" @change="form.pluginMaterId = undefined">
            <el-option v-for="item in mainOptions" :key="item.value" :label="label(item)" :value="Number(item.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="插件产品" prop="pluginMaterId">
          <el-select v-model="form.pluginMaterId" filterable placeholder="请选择料号为主产品料号 + T 的产品">
            <el-option v-for="item in pluginOptions" :key="item.value" :label="label(item)" :value="Number(item.value)" />
          </el-select>
          <div v-if="form.mainMaterId && !pluginOptions.length" class="helper">未找到对应的 T 结尾插件产品，请先新增该物料。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editing = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import { useDictStore } from "@/stores/modules/dict";
import { deleteMaterBinding, getMaterBindings, saveMaterBinding } from "@/api/modules/mater";

const visible = ref(false);
const editing = ref(false);
const loading = ref(false);
const saving = ref(false);
const records = ref<any[]>([]);
const form = ref<any>({});
const formRef = ref<FormInstance>();
const dictStore = useDictStore();
const materials = computed<any[]>(() => dictStore.dictMap.mater || []);
const boundMainIds = computed(() => new Set(records.value.filter(row => row.id !== form.value.id).map(row => String(row.mainMaterId))));
const boundPluginIds = computed(() => new Set(records.value.filter(row => row.id !== form.value.id).map(row => String(row.pluginMaterId))));
const mainOptions = computed(() => materials.value.filter(item => !String(item.num || "").endsWith("T") && !boundMainIds.value.has(String(item.value)) && !boundPluginIds.value.has(String(item.value))));
const pluginOptions = computed(() => {
  const main = materials.value.find(item => String(item.value) === String(form.value.mainMaterId));
  return main ? materials.value.filter(item => item.num === `${main.num}T` && !boundPluginIds.value.has(String(item.value))) : [];
});
const rules: FormRules = {
  mainMaterId: [{ required: true, message: "请选择主产品", trigger: "change" }],
  pluginMaterId: [{ required: true, message: "请选择插件产品", trigger: "change" }]
};
const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;
const label = (item: any) => `${item.num || ""} / ${item.label || ""}`;
const load = async () => { loading.value = true; try { records.value = unwrap(await getMaterBindings()) || []; } finally { loading.value = false; } };
const open = async () => { await dictStore.loadDict("mater", { force: true }); await load(); visible.value = true; };
const edit = (row: any = {}) => { form.value = { id: row.id, mainMaterId: row.mainMaterId, pluginMaterId: row.pluginMaterId }; editing.value = true; };
const submit = async () => {
  if (!await formRef.value?.validate()) return;
  saving.value = true;
  try { await saveMaterBinding(form.value); ElMessage.success("保存成功"); editing.value = false; await load(); }
  finally { saving.value = false; }
};
const remove = async (row: any) => { await ElMessageBox.confirm(`确认删除 ${row.mainMaterNum} 与 ${row.pluginMaterNum} 的绑定关系？`, "提示", { type: "warning" }); await deleteMaterBinding(row.id); ElMessage.success("删除成功"); await load(); };
defineExpose({ open });
</script>

<style scoped>
.add-button{margin-top:12px}.binding-form{margin-top:18px}:deep(.el-select){width:100%}.helper{margin-top:6px;color:var(--el-color-warning);line-height:1.4}
</style>
