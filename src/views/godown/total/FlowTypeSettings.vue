<template>
  <div class="settings-page">
    <el-alert title="禁用后，该类型无法用于手工录入和业务同步；隐藏仅影响手工录入选项。修改立即保存，不影响历史流水。"
      type="info" :closable="false" show-icon />
    <div class="filters">
      <el-input v-model="keyword" placeholder="搜索类型名称或编码" clearable aria-label="搜索类型" />
      <el-select v-model="profile" placeholder="全部仓库" clearable aria-label="适用仓库">
        <el-option v-for="item in profiles" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <el-button :loading="loading" :disabled="saving.size > 0" @click="loadTypes">刷新</el-button>
    </div>
    <el-table v-loading="loading" :data="filteredTypes" row-key="id" border height="100%">
      <el-table-column prop="name" label="类型名称" min-width="140" />
      <el-table-column prop="code" label="类型编码" min-width="180" />
      <el-table-column label="适用仓库" min-width="140"><template #default="{ row }">{{ profiles.find(item => item.value === row.warehouseCode)?.label }}</template></el-table-column>
      <el-table-column label="方向" width="85"><template #default="{ row }">{{ row.direction === 'IN' ? '入库' : '出库' }}</template></el-table-column>
      <el-table-column label="库存类别" width="100"><template #default="{ row }">{{ qualityName(row.qualityStatus) }}</template></el-table-column>
      <el-table-column label="是否启用" width="130">
      <template #default="{ row }">
        <el-switch :data-type-id="row.id" :model-value="row.enabled" :active-value="1" :inactive-value="0" inline-prompt
          active-text="启用" inactive-text="禁用" :aria-label="`${row.name}是否启用`"
          :loading="saving.has(row.id)" :disabled="saving.has(row.id)"
          @change="value => save(row, 'enabled', Number(value))" />
      </template>
      </el-table-column>
      <el-table-column label="是否显示" width="130">
      <template #default="{ row }">
        <el-switch :model-value="row.frontShow" :active-value="1" :inactive-value="0" inline-prompt
          active-text="显示" inactive-text="隐藏" :aria-label="`${row.name}是否显示`"
          :loading="saving.has(row.id)" :disabled="saving.has(row.id)"
          @change="value => save(row, 'frontShow', Number(value))" />
      </template>
    </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { getFlowTypeSettings, getWarehouses, updateFlowTypeSettings, qualityName,
  type StockFlowTypeSetting } from "@/api/modules/stock";

const types = ref<StockFlowTypeSetting[]>([]);
const keyword = ref(""), profile = ref(""), loading = ref(false);
const saving = ref(new Set<number>());
const profiles = ref<{ label: string; value: string }[]>([]);
const filteredTypes = computed(() => types.value.filter(row =>
  (!keyword.value || `${row.name} ${row.code}`.toLowerCase().includes(keyword.value.trim().toLowerCase()))
  && (!profile.value || row.warehouseCode === profile.value)));
const loadTypes = async () => {
  loading.value = true;
  try {
    const [result, warehouses] = await Promise.all([getFlowTypeSettings(), getWarehouses()]);
    types.value = result.data;
    profiles.value = [...new Set(types.value.map(row => row.warehouseCode))].map(value => ({
      value, label: warehouses.data.filter(row => row.flowProfile === value).map(row => row.name).join("、") || value
    }));
  } catch {
    // 请求失败由HTTP层提示。
  } finally { loading.value = false; }
};
onMounted(loadTypes);
const save = async (row: StockFlowTypeSetting, field: "enabled" | "frontShow", value: number) => {
  if (!Number.isInteger(row.id) || row.id <= 0) {
    ElMessage.error("类型编号缺失，请刷新类型列表后重试");
    return;
  }
  if (saving.value.has(row.id)) return;
  saving.value.add(row.id);
  try {
    await updateFlowTypeSettings(row.id, { [field]: value });
    row[field] = value;
    ElMessage.success("已保存");
  } catch {
    // 请求失败由HTTP层提示，保留原状态。
  } finally {
    saving.value.delete(row.id);
  }
};
</script>

<style scoped>
.filters { display: flex; gap: 12px; flex-wrap: wrap; }
.filters .el-input, .filters .el-select { width: 240px; }
.settings-page { display: flex; flex-direction: column; gap: 16px; height: 65vh; min-height: 300px; }
</style>
