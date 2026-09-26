<template>
  <el-button :loading="loading" @click="check">网络检测</el-button>
  <el-dialog v-model="visible" title="网络检测" width="min(520px, 94vw)">
    <p>由 ERP 服务器依次检测百度、192.168.0.110、192.168.0.16，必要时检测网关。</p>
    <el-alert v-if="loading" title="正在检测，请稍候…" type="info" :closable="false" show-icon />
    <el-alert v-else-if="error" :title="error" type="error" :closable="false" show-icon />
    <template v-else-if="report">
      <el-alert :title="report.message" :type="report.normal ? 'success' : 'warning'" :closable="false" show-icon />
      <el-table :data="report.probes" aria-label="网络检测明细">
        <el-table-column label="名称" width="80">
          <template #default="{ row }">{{ addressNames[row.address] || row.address }}</template>
        </el-table-column>
        <el-table-column prop="address" label="检测地址" />
        <el-table-column label="检测结果" width="110">
          <template #default="{ row }">
            <el-tag :type="row.reachable ? 'success' : 'danger'">{{ row.reachable ? "通" : "不通" }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </template>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" :loading="loading" @click="check">重新检测</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { checkNetwork, type NetworkReport } from "@/api/modules/network";

const visible = ref(false);
const loading = ref(false);
const report = ref<NetworkReport>();
const error = ref("");
const addressNames: Record<string, string> = {
  "www.baidu.com": "百度",
  "192.168.0.110": "B区",
  "192.168.0.16": "C区",
  "192.168.0.1": "网关",
};

async function check() {
  if (loading.value) return;
  visible.value = true;
  loading.value = true;
  report.value = undefined;
  error.value = "";
  try {
    report.value = (await checkNetwork()).data;
  } catch {
    error.value = "检测失败，请确认 ERP 服务器可连接且可以执行 ping 后重试。";
  } finally {
    loading.value = false;
  }
}
</script>
