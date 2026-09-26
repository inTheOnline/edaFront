<template>
  <div class="xiangxin table-box">
    <section class="card query-panel">
      <h2>祥鑫系统操作</h2>
      <p class="description">输入包装箱条码，查询并批量移除箱内全部物料。关闭的包装箱会先解包装。</p>
      <el-form label-position="top" :disabled="busy || running" @submit.prevent="query">
        <div class="query-fields">
          <el-form-item label="祥鑫账号"><el-input v-model="form.account" autocomplete="username" /></el-form-item>
          <el-form-item label="祥鑫密码">
            <el-input v-model="form.password" type="password" show-password autocomplete="current-password" />
          </el-form-item>
          <el-form-item label="包装箱条码">
            <el-input v-model="form.carton" placeholder="输入或扫描包装箱条码" clearable />
          </el-form-item>
          <el-button class="query-button" type="primary" native-type="submit" :loading="busy">查询箱内物料</el-button>
        </div>
      </el-form>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <el-button v-if="pollError" @click="refreshProgress">重新获取进度</el-button>
    </section>

    <section v-if="batch" class="card result-panel" aria-label="包装箱物料和处理进度">
      <div class="result-header">
        <div class="box-info">
          <strong>{{ batch.carton }}</strong>
          <el-tag :type="batch.cartonStatus === 0 ? 'info' : 'success'"
            >查询时：{{ batch.cartonStatus === 0 ? "关闭" : "打开" }}</el-tag
          >
          <span>共 {{ batch.grns.length }} 条物料</span>
        </div>
        <el-button
          type="danger"
          :disabled="batch.state !== 'ready' || !batch.grns.length || busy"
          :loading="running"
          @click="removeAll"
        >
          批量删除全部物料
        </el-button>
      </div>
      <div class="progress" aria-live="polite">
        <el-alert
          :title="batch.message"
          :type="batch.state === 'failed' ? 'error' : batch.state === 'done' ? 'success' : 'info'"
          :closable="false"
          show-icon
        />
        <template v-if="batch.state !== 'ready'">
          <p>已确认移除 {{ batch.removed.length }} / {{ batch.grns.length }} 条</p>
          <el-progress
            :percentage="percentage"
            :status="batch.state === 'failed' ? 'exception' : batch.state === 'done' ? 'success' : undefined"
          />
        </template>
      </div>
      <el-table :data="rows" border stripe max-height="520" empty-text="包装箱内没有物料" row-key="grn">
        <el-table-column type="index" label="序号" width="70" />
        <el-table-column prop="grn" label="物料条码" min-width="210" />
        <el-table-column label="处理结果" min-width="140">
          <template #default="{ row }">
            <el-tag :type="row.removed ? 'success' : 'info'">{{
              row.removed ? "已确认移除" : batch.state === "failed" ? "未确认，请重新查询" : "待移除"
            }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </section>
    <div v-else class="card empty-panel"><el-empty description="查询后显示包装箱状态和物料明细" /></div>
  </div>
</template>

<script setup lang="ts" name="xiangxin">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { previewXiangxin, startXiangxin, progressXiangxin, type XiangxinBatch } from "@/api/modules/xiangxin";

const form = reactive({ account: "E0326", password: "", carton: "" });
const batch = ref<XiangxinBatch>();
const busy = ref(false);
const error = ref("");
const pollError = ref(false);
const running = computed(() => batch.value?.state === "running");
const rows = computed(() => batch.value?.grns.map((grn) => ({ grn, removed: batch.value!.removed.includes(grn) })) || []);
const percentage = computed(() =>
  batch.value?.grns.length ? Math.round((batch.value.removed.length / batch.value.grns.length) * 100) : 0,
);
let timer: ReturnType<typeof setTimeout> | undefined;
let disposed = false;
const storageKey = "xiangxin-batch";
const message = (e: any) => e?.message || e?.msg || "请求失败，请检查连接后重试";

function save(value: XiangxinBatch) {
  batch.value = value;
  sessionStorage.setItem(storageKey, value.id);
}
async function query() {
  if (busy.value || running.value) return;
  error.value = "";
  if (!form.account.trim() || !form.password || !form.carton.trim()) {
    error.value = "请输入祥鑫账号、密码和包装箱条码";
    return;
  }
  clearTimeout(timer);
  batch.value = undefined;
  sessionStorage.removeItem(storageKey);
  busy.value = true;
  try {
    save((await previewXiangxin({ ...form, carton: form.carton.trim() })).data);
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
async function removeAll() {
  if (!batch.value || busy.value || batch.value.state !== "ready") return;
  const selected = batch.value;
  try {
    await ElMessageBox.confirm(
      `将移除包装箱 ${selected.carton} 内全部 ${selected.grns.length} 条物料${selected.cartonStatus === 0 ? "，并先解包装" : ""}。是否继续？`,
      "确认批量删除",
      {
        type: "warning",
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
      },
    );
  } catch {
    return;
  }
  busy.value = true;
  error.value = "";
  // 请求结果未知时保留执行状态，先恢复进度，避免另建批次重复删除。
  selected.state = "running";
  selected.message = "正在提交删除任务";
  try {
    save((await startXiangxin(selected.id)).data);
  } catch (e) {
    error.value = `${message(e)}。正在查询任务状态，请勿重复创建删除任务。`;
  } finally {
    busy.value = false;
    await refreshProgress();
  }
}
async function refreshProgress() {
  clearTimeout(timer);
  const id = batch.value?.id || sessionStorage.getItem(storageKey);
  if (!id || disposed) return;
  try {
    save((await progressXiangxin(id)).data);
    if (pollError.value) error.value = "";
    pollError.value = false;
    if (running.value && !disposed) timer = setTimeout(refreshProgress, 1500);
  } catch (e) {
    pollError.value = true;
    error.value = `${message(e)}。后台任务可能仍在执行，请重新获取进度。`;
  }
}
onMounted(refreshProgress);
onBeforeUnmount(() => {
  disposed = true;
  clearTimeout(timer);
  form.password = "";
});
</script>

<style scoped lang="scss">
.xiangxin {
  gap: 16px;
  overflow: auto;
}
.query-panel,
.result-panel {
  padding: 20px;
}
h2 {
  margin: 0 0 8px;
  font-size: 20px;
}
.description {
  margin: 0 0 20px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}
.query-fields {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr auto;
  gap: 16px;
  align-items: end;
}
.query-fields :deep(.el-form-item) {
  margin-bottom: 0;
}
.query-button {
  min-height: 32px;
}
.result-header,
.box-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.result-header {
  justify-content: space-between;
  margin-bottom: 16px;
}
.progress {
  margin-bottom: 16px;
}
.error {
  color: var(--el-color-danger);
  line-height: 1.6;
}
.empty-panel {
  flex: 1;
}
@media (max-width: 900px) {
  .query-fields {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 540px) {
  .query-fields {
    grid-template-columns: 1fr;
  }
  .query-panel,
  .result-panel {
    padding: 12px;
  }
  .query-button {
    min-height: 44px;
  }
}
</style>
