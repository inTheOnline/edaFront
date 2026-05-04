<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="1120px" :close-on-click-modal="false" destroy-on-close>
    <div v-for="group in groups" :key="group.outItem.id" class="group-block">
      <div class="group-header">
        <span>外发单号：{{ group.outItem.subcNum || "--" }}</span>
        <span>物料：{{ group.outItem.materNum || "--" }} / {{ group.outItem.materName || "--" }}</span>
        <span>关联回货：{{ group.records.length }} 条</span>
      </div>
      <el-table :data="group.records" border max-height="300" empty-text="暂无关联回货明细">
        <el-table-column prop="outbackNum" label="回货单号" min-width="150" />
        <el-table-column prop="backDate" label="回货日期" width="120" :formatter="formatBackDate" />
        <el-table-column prop="number" label="数量" width="100" />
        <el-table-column prop="stateLabel" label="状态" width="120" />
        <el-table-column prop="remark" label="备注" min-width="180" />
      </el-table>
    </div>

    <template #footer>
      <div class="footer-actions">
        <el-button @click="visible = false">{{ mode === "delete" ? "取消" : "关闭" }}</el-button>
        <el-button v-if="mode === 'delete'" type="danger" @click="emit('confirm-delete')">确认删除</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { formatOutgoingDate, type OutformRecord, type RelatedOutbackRecord } from "../../service";

type GroupItem = {
  outItem: OutformRecord;
  records: RelatedOutbackRecord[];
};

type OpenParams = {
  mode: "view" | "delete";
  groups: GroupItem[];
};

const visible = ref(false);
const mode = ref<"view" | "delete">("view");
const groups = ref<GroupItem[]>([]);
const formatBackDate = (row: RelatedOutbackRecord) => formatOutgoingDate(row.backDate);

const dialogTitle = computed(() => (mode.value === "delete" ? "删除确认（含关联回货明细）" : "外发回货明细"));

const open = (params: OpenParams) => {
  mode.value = params.mode;
  groups.value = params.groups;
  visible.value = true;
};

const emit = defineEmits<{
  "confirm-delete": [];
}>();

defineExpose({ open });
</script>

<style scoped lang="scss">
.group-block {
  margin-bottom: 16px;
}

.group-block:last-child {
  margin-bottom: 0;
}

.group-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  margin-bottom: 10px;
  font-weight: 600;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
