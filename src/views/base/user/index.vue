<template>
  <div class="user-container">
    <!-- 本次改动：新增用户管理概览区，强化页面主题并提升第一屏质感。 -->
    <section class="user-hero">
      <div>
        <p class="hero-eyebrow">Base Center / User Access</p>
        <h1>用户管理</h1>
        <span>统一维护系统用户、职位角色、成员归属和权限范围</span>
      </div>
      <div class="hero-metrics">
        <div>
          <strong>{{ currentUserList.length }}</strong>
          <span>当前页用户</span>
        </div>
        <div>
          <strong>{{ roleCount }}</strong>
          <span>职位角色</span>
        </div>
        <div>
          <strong>{{ enabledUserCount }}</strong>
          <span>启用用户</span>
        </div>
      </div>
    </section>

    <div class="user-table-wrap">
      <ProTable
        :columns="columns"
        :request-api="getAllUser"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="用户管理"
        ref="proTableRef"
        :search-col="{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }"
      >
        <!-- 2.表格数据操作按钮区域 -->
        <template #operation="scope">
          <el-button type="primary" link :icon="View" @click="openDrawer('查看', scope.row)">查看</el-button>
          <el-button type="primary" link :icon="EditPen" @click="openDrawer('编辑', scope.row)">编辑</el-button>
          <el-button type="primary" link :icon="Delete" @click="deleteOne(scope.row)">删除</el-button>
        </template>
        <template #tableHeader="scope">
          <el-button type="primary" :icon="CirclePlus" @click="openDrawer('新增')">新增用户</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            plain
            @click="deleteSelected(scope.selectedListIds)"
            :disabled="!scope.isSelected"
          >
            批量删除用户
          </el-button>
          <el-button type="primary" :icon="Setting" @click="winFlag = true">职位权限编辑</el-button>
        </template>
      </ProTable>
    </div>
    <UserDrawer ref="drawerRef" />

    <PermissionEditor
      :visible="winFlag"
      :role-list="dictStore.dictMap['role']"
      :menu-tree="menuTree"
      :role-dto-list="roleList"
      :user-list="currentUserList"
      :extra-permission-groups="extraPermissionGroups"
      :update-api="updateRolePermission"
      :add-role-api="addRole"
      :role-users-api="getRoleUsers"
      @update:visible="winFlag = $event"
      @saved="reloadData"
    />
    <!-- 权限编辑模块 -->
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { getAllUser, addUser, deleteUsers,editUser } from "@/api/modules/mySystem/users";
import { addRole, getRoleUsers, rolesMap,getRoles,savePower } from "@/api/modules/system/role";
import { getPowerTree } from "@/api/modules/system/power";
import { GenderMap } from "@/enums/baseEnum";
import UserDrawer from "@/views/base/user/components/UserDrawer.vue";
import PermissionEditor from "@/views/base/user/components/PermissionEditor.vue";
import { CirclePlus, Delete, EditPen, Setting, View } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import {useDictStore} from '@/stores/modules/dict'
const dictStore = useDictStore()
const roleList = ref<any[]>([])
const currentUserList = ref<any[]>([])
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
// 权限菜单树（从后端拉）
const menuTree = ref();
onMounted(async () => {
  await dictStore.loadDicts(['role']);
   menuTree.value = await (await getPowerTree()).data;
   // 本次改动：兼容后端返回数组或分页包装，缺字段时不阻塞页面渲染。
   const rolePowerData = ((await getRoles()).data as unknown) as any;
   roleList.value = Array.isArray(rolePowerData) ? rolePowerData : rolePowerData?.records || rolePowerData?.data || [];
});
const dataCallback = (data) => {
  // 数据回调
  currentUserList.value = data.records || [];
  return {
    list: data.records,
    total: data.total,
  };
};

const roleCount = computed(() => dictStore.dictMap['role']?.length || 0);
const enabledUserCount = computed(() => {
  return currentUserList.value.filter(user => user.userStatic === "启用" || user.userStatus === "启用" || user.userStatic === 1).length;
});

// 本次改动：额外权限统一在这里配置，后续新增权限类型只要追加一个分组并让后端接收同名 key。
const extraPermissionGroups = [
  {
    key: "price",
    title: "价格权限",
    summary: "控制用户是否可以查看、编辑和审批价格字段",
    options: [
      { label: "查看价格", value: "price:view", description: "允许在物料、订单等页面查看价格信息" },
      { label: "编辑价格", value: "price:edit", description: "允许修改报价、采购价和销售价" },
      { label: "价格审批", value: "price:approve", description: "允许审核价格变更记录" }
    ]
  },
  {
    key: "system",
    title: "系统权限",
    summary: "控制系统级配置、日志和基础资料维护能力",
    options: [
      { label: "系统配置", value: "system:config", description: "允许维护系统参数和基础配置" },
      { label: "操作日志", value: "system:log", description: "允许查看用户操作日志与审计记录" },
      { label: "数据维护", value: "system:data", description: "允许维护系统基础数据" }
    ]
  },
  {
    key: "buy",
    title: "请购权限",
    summary: "控制代请购、审核、采购录入与全量查看能力",
    options: [
      { label: "代请购", value: "buy:apply:assist", description: "允许帮其他用户提交请购" },
      { label: "采购录入", value: "buy:purchase", description: "允许录入采购记录与批量采购信息" },
      { label: "审核请购", value: "buy:audit", description: "允许审核通过和驳回请购单" },
      { label: "查看全部", value: "buy:view:all", description: "允许查看全部请购记录，不受本人关联限制" }
    ]
  }
];

const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  {
    type: "index",
    label: "序号",
    width: 60,
    align: "center",
    fixed: "left",
    // 本次改动：保留分页序号算法，同时兼容表格实例还没初始化的瞬间。
    index: index => {
      const pageable = proTableRef.value?.pageable;
      return ((pageable?.pageNum || 1) - 1) * (pageable?.pageSize || 10) + index + 1;
    }
  },
  {
    label: "用户名",
    prop: "userName",
    search: {
      el: "input",
      tooltip: "输入用户名称进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
  },
  {
    label: "密码",
    prop: "password",
    isShow: false,
    isSetting: false
  },
  {
    label: "持有者",
    prop: "name",
    width: 200
  },
  {
    label: "职位",
    prop: "roleId",
    width: 200,
    enum: rolesMap,
    tag: true,
    fieldNames: { label: "name", value: "id" }
  },
  {
    label: "性别",
    prop: "gender",
    enum: GenderMap,
    width: 100
  },
  {
    label: "用户状态",
    prop: "userStatic",
    tag: true,
    width: 150
  },
  {
    label: "备注",
    prop: "userNotes",
  },
  { prop: "operation", label: "操作", fixed: "right", width: 330 },
]);
// 窗口
const winFlag = ref(false);

// 保存权限的 API
const updateRolePermission = async (params) => {
  // 本次改动：保存参数包含 access 与 extraPermissions，后端暂未支持的字段会先按模拟数据联调。
  await savePower(params);
};

const reloadData = () => {
  // 保存后你可以刷新用户表格
  proTableRef.value?.getTableList();
  dictStore.loadDicts(['role']);
  getRoles().then(res => {
    const rolePowerData = res.data as any;
    roleList.value = Array.isArray(rolePowerData) ? rolePowerData : rolePowerData?.records || rolePowerData?.data || [];
  });
};
// 打开抽屉
const openDrawer = (title: string, row: any = {}) => {
  const params = {
    title,
    isView: title === "查看",
    row: { ...row },
    api: title === "新增" ? addUser : title === "编辑" ?  edit: undefined,
    getTableList: proTableRef.value?.getTableList,
  };
  drawerRef.value?.acceptParams(params);
};

// 删除已选项目
const deleteSelected = async (ids): Promise<void> => {
  await deleteUsers(ids);
  ElMessage.success("删除用户成功！");
  proTableRef.value?.getTableList();
};
//删除单个
const deleteOne = async (row) =>{
  const ids = [row.id];
  await deleteSelected(ids);
}

const edit =  (user) =>{
  editUser(user);
  proTableRef.value?.reset();
}
</script>

<style lang="scss" scoped>
.user-container {
  min-height: 91%;
  padding: 18px;
  background: #f5f7f8;
}

.user-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px;
  margin-bottom: 18px;
  overflow: hidden;
  background:
    linear-gradient(120deg, rgba(20, 184, 166, 0.14), rgba(255, 255, 255, 0) 42%),
    #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);

  h1 {
    margin: 6px 0;
    font-size: 30px;
    font-weight: 800;
    color: #111827;
  }

  span {
    color: #64748b;
  }
}

.hero-eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #0f9f8f;
  letter-spacing: 0;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, 108px);
  gap: 12px;

  div {
    padding: 14px 12px;
    text-align: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  strong {
    display: block;
    margin-bottom: 4px;
    font-size: 24px;
    color: #0f766e;
  }

  span {
    font-size: 12px;
  }
}

.user-table-wrap {
  min-width: 0;
}
</style>
