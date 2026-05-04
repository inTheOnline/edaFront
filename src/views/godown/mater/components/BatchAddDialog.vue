<template>
  <el-dialog
    v-model="visible"
    title="批量价格变更"
    width="50%"
    :close-on-click-modal="false"
  >
    <div class="batch-change">
      <!-- 公共信息 -->
      <el-form :model="form" label-width="100px">
        <el-form-item label="生效日期">
          <el-date-picker
            v-model="form.effectiveDate"
            type="date"
            placeholder="请选择生效日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item label="修改原因">
          <el-input
            v-model="form.changeReason"
            placeholder="请输入调价原因"
          />
        </el-form-item>
      </el-form>

      <!-- 明细表 -->
      <el-table
        :data="form.records"
        border
        style="width: 100%; margin-top: 10px;"
      >
        <el-table-column type="index" label="#" width="50" align="center" />

        <!-- 物料 -->
        <el-table-column label="物料" min-width="220">
          <template #default="{ row }">
            <el-select
              v-model="row.materId"
              placeholder="请选择物料"
              filterable
              style="width: 100%;"
              @change="onMaterChange(row)"
            >
              <el-option
                v-for="item in materList"
                :key="item.value"
                :label="`${item.label}（${item.num}）`"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <!-- 原价 -->
        <el-table-column label="原价" width="200" align="center">
          <template #default="{ row }">
            <el-input v-model="row.oldPrice" disabled />
          </template>
        </el-table-column>

        <!-- 新价 -->
        <el-table-column label="新价" width="200" align="center">
          <template #default="{ row }">
            <el-input
              v-model.number="row.price"
              type="number"
              min="0"
              placeholder=""
            />
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ $index }">
            <el-button
              type="danger"
              link
              @click="removeRow($index)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="actions">
        <el-button type="primary" @click="addRow">
          添加一行
        </el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="submit">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { batchChangePriceApi,getPriceMap } from "@/api/modules/mater";

/**
 * 父组件通过 open() 传入
 */
const visible = ref(false);

const materList = ref<
  {
    value: number;
    label: string;
    num?: string;
    salePrice?: number;
  }[]
>([]);
let refreshTable: (() => void) | null = null;

const form = ref({
  effectiveDate: "",
  changeReason: "",
  records: [] as Array<{
    materId: number | "";
    oldPrice: number | null;
    price: number | null;
  }>
});
const priceMap = ref<Map<number, number>>(new Map());

const loadPriceMap = async () => {
  const res = await getPriceMap();

  // res.data 是普通对象 { "1": 100, "2": 85 }
  priceMap.value = new Map(
    Object.entries(res.data).map(([key, value]) => [
      Number(key),
      Number(value)
    ])
  );
};
const open = async (params: {
  materList: {
    value: number;
    label: string;
    num?: string;
  }[];
  refreshTable?: () => void;
}) => {
  visible.value = true;
  materList.value = params.materList || [];
  refreshTable = params.refreshTable || null;

  form.value.effectiveDate = "";
  form.value.changeReason = "";
  form.value.records = [];

  // ⭐ 先拉价格
  await loadPriceMap();

  addRow();
};


// 添加一行
const addRow = () => {
  form.value.records.push({
    materId: "",
    oldPrice: null,
    price: null
  });
};

// 删除一行
const removeRow = (index: number) => {
  form.value.records.splice(index, 1);
};

// 选择物料时自动带出原价
const onMaterChange = (row: any) => {
  const price = priceMap.value.get(row.materId) ?? null;

  row.oldPrice = price;
  row.price = price;
};

// 提交
const submit = async () => {
  if (!form.value.effectiveDate) {
    return ElMessage.warning("请选择生效日期");
  }
  if (!form.value.records.length) {
    return ElMessage.warning("请至少添加一条记录");
  }

  const payload = form.value.records.map(r => ({
    materId: r.materId,
    price: r.price,
    effiecDate: form.value.effectiveDate,
    changeReason: form.value.changeReason
  }));

  await batchChangePriceApi(payload);
  ElMessage.success("价格变更成功");

  visible.value = false;
  refreshTable?.();
};

defineExpose({ open });
</script>

<style scoped>
.batch-change {
  max-height: 70vh;
  overflow: auto;
}

.actions {
  margin-top: 10px;
  text-align: left;
}
</style>
