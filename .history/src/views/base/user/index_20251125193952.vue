<template>
  <div class="user-container">
    <div>
      <ProTable
        :columns="columns"
        :request-api="getAllUser"
        :dataCallback="dataCallback"
        :pagination="true"
        :tool-button="['refresh', 'setting', 'search']"
        row-key="id"
        title="Outgoing-Form"
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
          <el-button type="primary" :icon="CirclePlus" @click="winFlag = true">职位权限编辑</el-button>
        </template>
      </ProTable>
    </div>
    <UserDrawer ref="drawerRef" />

    <PermissionEditor
      :visible="winFlag"
      :role-list="dictStore.dictMap['role']"
      :menu-tree="menuTree"
      :update-api="updateRolePermission"
      @update:visible="winFlag = $event"
      @saved="reloadData"
    />
    <!-- 权限编辑模块 -->
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, toRefs,onMounted } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { getAllUser, addUser, deleteUsers,editUser } from "@/api/modules/mySystem/users";
import { rolesMap } from "@/api/modules/system/role";
import { getPowerTree } from "@/api/modules/system/power";
import { GenderMap } from "@/enums/baseEnum";
import UserDrawer from "@/views/base/user/components/UserDrawer.vue";
import PermissionEditor from "@/views/base/user/components/PermissionEditor.vue";
import { CirclePlus, Delete, EditPen, View } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { ColumnProps } from "@/components/ProTable/interface";
import { ElMessageBox } from 'element-plus'
import {useDictStore} from '@/stores/modules/dict'
const dictStore = useDictStore()
const key = ref(0);
const proTableRef = ref<InstanceType<typeof ProTable> | null>(null);
const drawerRef = ref<InstanceType<typeof UserDrawer> | null>(null);
  // 权限菜单树（从后端拉）
const menuTree = ref([]);
onMounted(async () => {
  await dictStore.loadDicts(['role']);
   menuTree.value = await (await getPowerTree()).data;
});
const dataCallback = (data) => {
  // 数据回调
  return {
    list: data.records,
    total: data.total,
  };
};

const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  { type: "index", label: "序号", width : 60, align: "center",fixed: "left",
  index : (index) => (proTableRef.value.pageable.pageNum - 1) * proTableRef.value.pageable.pageSize + index + 1 },
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
const handleClose = (done: () => void) => {
  ElMessageBox.confirm('您确定要关闭此对话框吗？')
    .then(() => {
      done()
    })
    .catch(() => {
      // catch error
    })
}

// 保存权限的 API
const updateRolePermission = async (formMap) => {
  console.log("即将保存权限 →", formMap);

  // 你可以直接 POST 到后端
  await ;
};

const reloadData = () => {
  // 保存后你可以刷新用户表格
  proTableRef.value?.getTableList();
};
//权限
const options = [{value:1 ,lable:"首页"}]

const resetPermission = (roleKey: string) => {
  formMap[roleKey].access = [];
  formMap[roleKey].enabled = true;
};
// 权限表单数据，根据角色动态生成
const formMap = reactive<{ [key: string]: any }>({});
// 打开抽屉
const openDrawer = (title: string, row: Object = {}) => {
  console.log(title, row);
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
  ElMessage.success("删除用户成功！`");
  proTableRef.value?.getTableList();
};
//删除单个
const deleteOne = async (row) =>{
  const ids = [row.id];
  await deleteSelected(ids);
  proTableRef.value?.reset;
}

const edit =  (user) =>{
  editUser(user);
  proTableRef.value?.reset();
}
</script>

<style lang="scss" scoped>
.user-container {
  display: flex;
  height: 91%;
}
.context{
  display:inline-table;
  margin-right: 20px;
}
</style>
