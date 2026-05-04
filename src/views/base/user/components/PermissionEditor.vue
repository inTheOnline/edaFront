<template>
  <el-dialog v-model="visible" width="1080px" destroy-on-close class="permission-dialog" @close="close">
    <template #header>
      <!-- 本次改动：重做权限弹窗标题区，让“职位权限编辑”更贴合用户管理主题。 -->
      <div class="permission-header">
        <div>
          <p class="permission-eyebrow">用户管理 / 角色权限</p>
          <h2>职位权限编辑</h2>
          <span>集中维护角色、成员归属、路由权限和业务权限</span>
        </div>
        <el-button type="primary" :icon="CirclePlus" @click="openRoleDialog">添加角色</el-button>
      </div>
    </template>

    <div class="permission-layout">
      <!-- 本次改动：角色列表增加成员数和权限数，方便快速判断角色配置是否完整。 -->
      <aside class="role-panel">
        <div class="role-panel-title">
          <span>角色列表</span>
          <strong>{{ displayRoleList.length }}</strong>
        </div>
        <el-scrollbar height="560px">
          <button
            v-for="role in displayRoleList"
            :key="role.value"
            class="role-item"
            :class="{ active: String(role.value) === activeRole }"
            type="button"
            @click="switchRole(String(role.value))"
          >
            <span class="role-name">{{ role.label }}</span>
            <span class="role-meta">{{ getRoleUsers(role.value).length }} 人 · {{ getPermissionCount(role.value) }} 项权限</span>
          </button>
        </el-scrollbar>
      </aside>

      <section v-if="activeRole && currentForm" class="permission-content">
        <!-- 本次改动：角色概览把启用状态、成员数量、权限数量放在第一屏。 -->
        <div class="role-overview">
          <div>
            <p>当前角色</p>
            <h3>{{ currentRoleName }}</h3>
          </div>
          <div class="overview-metrics">
            <div>
              <span>{{ currentMembers.length }}</span>
              <p>成员</p>
            </div>
            <div>
              <span>{{ currentForm.access.length }}</span>
              <p>路由权限</p>
            </div>
            <div>
              <span>{{ currentExtraCount }}</span>
              <p>业务权限</p>
            </div>
          </div>
          <el-switch v-model="currentForm.enabled" active-text="启用角色" />
        </div>

        <div class="member-section">
          <div class="section-title">
            <span>角色成员</span>
            <em>优先读取后端角色成员接口，接口不可用时使用当前页用户兜底</em>
          </div>
          <div v-if="currentMembers.length" class="member-list">
            <el-tag v-for="user in currentMembers" :key="user.id || user.userName" effect="plain" round>
              {{ user.name || user.userName }}
            </el-tag>
          </div>
          <el-empty v-else description="当前列表暂无该角色成员" :image-size="72" />
        </div>

        <!-- 本次改动：权限按类型拆分，后续新增权限类型只需扩展 extraPermissionGroups。 -->
        <el-tabs v-model="activePermissionTab" class="permission-tabs" @tab-change="handleTabChange">
          <el-tab-pane label="路由权限" name="route">
            <div class="tree-toolbar">
              <span>菜单权限树</span>
              <div>
                <el-button size="small" @click="checkAllRoutes">全选</el-button>
                <el-button size="small" @click="clearRoutes">清空</el-button>
              </div>
            </div>
            <el-tree
              ref="treeRef"
              :data="menuTree"
              node-key="id"
              show-checkbox
              default-expand-all
              highlight-current
              :props="{ label: 'label', children: 'children' }"
              @check="updateRouteAccess"
              class="permission-tree"
            />
          </el-tab-pane>
          <el-tab-pane v-for="group in extraPermissionGroups" :key="group.key" :label="group.title" :name="group.key">
            <div class="business-permission">
              <div class="section-title">
                <span>{{ group.title }}</span>
                <em>{{ group.summary }}</em>
              </div>
              <el-checkbox-group v-model="currentForm.extraPermissions[group.key]" class="permission-options">
                <label v-for="option in group.options" :key="String(option.value)" class="permission-option">
                  <el-checkbox :label="option.value">
                    <strong>{{ option.label }}</strong>
                    <small>{{ option.description }}</small>
                  </el-checkbox>
                </label>
              </el-checkbox-group>
            </div>
          </el-tab-pane>
        </el-tabs>
      </section>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="save">保存权限</el-button>
      </div>
    </template>

    <el-dialog v-model="roleDialogVisible" width="420px" title="添加角色" append-to-body>
      <!-- 本次改动：优先调用后端新增角色接口，未传接口时保留本地模拟兜底。 -->
      <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-width="90px">
        <el-form-item label="角色名称" prop="label">
          <el-input v-model="roleForm.label" placeholder="请输入角色名称" clearable />
        </el-form-item>
        <el-form-item label="角色备注">
          <el-input v-model="roleForm.remark" placeholder="请输入备注" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addMockRole">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import { CirclePlus } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from "element-plus";

interface RoleDto {
  id: number | string;
  enabled: boolean;
  access?: (number | string)[];
  extraPermissions?: Record<string, (number | string)[]>;
  [key: string]: any;
}

interface RoleItem {
  label: string;
  value: number | string;
  remark?: string;
}

interface MenuNode {
  id: number | string;
  label: string;
  key?: number;
  children?: MenuNode[];
}

interface UserItem {
  id?: number | string;
  userName?: string;
  name?: string;
  roleId?: number | string;
}

interface PermissionOption {
  label: string;
  value: number | string;
  description: string;
}

interface ExtraPermissionGroup {
  key: string;
  title: string;
  summary: string;
  options: PermissionOption[];
}

interface PermissionForm {
  enabled: boolean;
  access: (number | string)[];
  extraPermissions: Record<string, (number | string)[]>;
}

const props = withDefaults(
  defineProps<{
    visible: boolean;
    roleList: RoleItem[];
    menuTree: MenuNode[];
    roleDtoList: RoleDto[];
    userList: UserItem[];
    extraPermissionGroups: ExtraPermissionGroup[];
    updateApi: Function;
    addRoleApi?: Function;
    roleUsersApi?: Function;
  }>(),
  {
    roleList: () => [],
    menuTree: () => [],
    roleDtoList: () => [],
    userList: () => [],
    extraPermissionGroups: () => []
  }
);
const emit = defineEmits(["update:visible", "saved"]);

const visible = ref(props.visible);
const activeRole = ref("");
const activePermissionTab = ref("route");
const treeRef = ref();
const roleDialogVisible = ref(false);
const roleFormRef = ref<FormInstance>();
const roleForm = reactive({ label: "", remark: "" });
const mockRoles = ref<RoleItem[]>([]);
const roleUserMap = reactive<Record<string, UserItem[]>>({});
const formMap = reactive<Record<string, PermissionForm>>({});
const syncingRouteTree = ref(false);

const roleRules = reactive<FormRules>({
  label: [{ required: true, message: "请输入角色名称", trigger: "blur" }]
});

const displayRoleList = computed(() => [...props.roleList, ...mockRoles.value]);
const currentForm = computed(() => formMap[activeRole.value]);
const currentRoleName = computed(() => displayRoleList.value.find(role => String(role.value) === activeRole.value)?.label || "");
const currentMembers = computed(() => getRoleUsers(activeRole.value));
const currentExtraCount = computed(() => countExtraPermissions(currentForm.value));

watch(
  () => props.visible,
  value => {
    visible.value = value;
  }
);

const renderRouteTree = async (roleValue = activeRole.value) => {
  if (activePermissionTab.value !== "route" || !roleValue) return;
  await nextTick();
  if (!treeRef.value) return;
  syncingRouteTree.value = true;
  try {
    // 本次修复：切换角色只把缓存权限渲染到树，不从树反读，避免父子节点归一化后把权限数量改掉。
    treeRef.value.setCheckedKeys([...(formMap[roleValue]?.access || [])]);
    await nextTick();
  } finally {
    syncingRouteTree.value = false;
  }
};

const initRoleForms = () => {
  displayRoleList.value.forEach(role => {
    const roleKey = String(role.value);
    const dto = props.roleDtoList.find(item => String(item.id) === roleKey);
    formMap[roleKey] = {
      enabled: dto?.enabled ?? true,
      access: dto?.access || [],
      extraPermissions: buildExtraPermissions(dto)
    };
  });

  if (!activeRole.value && displayRoleList.value.length > 0) {
    activeRole.value = String(displayRoleList.value[0].value);
  }

  renderRouteTree();
  // 本次修复：首次自动选中角色时主动加载成员，避免需要手动切换角色后成员才显示。
  if (activeRole.value) loadRoleUsers(activeRole.value);
};

const buildExtraPermissions = (dto?: RoleDto) => {
  const result: Record<string, (number | string)[]> = {};
  props.extraPermissionGroups.forEach(group => {
    // 本次改动：兼容 extraPermissions.price 与 pricePermissions 两种后端字段，方便后续 API 接入。
    result[group.key] = dto?.extraPermissions?.[group.key] || dto?.[`${group.key}Permissions`] || dto?.[group.key] || [];
  });
  return result;
};

const switchRole = (roleValue: string) => {
  // 本次修复：切换角色不再从树组件同步权限，权限只由用户勾选、全选、清空时改变。
  activeRole.value = roleValue;
};

const handleTabChange = async () => {
  await renderRouteTree();
};

const getRoleUsers = (roleValue: number | string) => {
  if (roleUserMap[String(roleValue)]) {
    return roleUserMap[String(roleValue)];
  }
  return props.userList.filter(user => String(user.roleId) === String(roleValue));
};

const loadRoleUsers = async (roleValue: number | string) => {
  if (!props.roleUsersApi || !roleValue || String(roleValue).startsWith("mock-")) return;
  const res = await props.roleUsersApi(roleValue);
  // 本次改动：优先使用后端角色成员接口，当前页用户列表只作为接口未接入时的兜底。
  roleUserMap[String(roleValue)] = res?.data || [];
};

watch(
  () => [props.roleList, props.roleDtoList, props.extraPermissionGroups],
  () => {
    // 本次修复：initRoleForms 使用 const 声明，监听器必须在函数初始化后再注册，避免弹窗打开时报 TDZ 错误。
    initRoleForms();
  },
  { immediate: true, deep: true }
);

watch(activeRole, async roleValue => {
  await renderRouteTree(roleValue);
  // 本次修复：角色成员加载依赖 loadRoleUsers，放在函数初始化后注册，避免首次切换角色时报错。
  loadRoleUsers(roleValue);
});

const countExtraPermissions = (form?: PermissionForm) => {
  if (!form) return 0;
  return Object.values(form.extraPermissions).reduce((total, list) => total + list.length, 0);
};

const getPermissionCount = (roleValue: number | string) => {
  const form = formMap[String(roleValue)];
  if (!form) return 0;
  return form.access.length + countExtraPermissions(form);
};

const collectMenuIds = (nodes: MenuNode[] = []) => {
  return nodes.flatMap(node => [node.id, ...collectMenuIds(node.children || [])]);
};

const checkAllRoutes = () => {
  const ids = collectMenuIds(props.menuTree);
  treeRef.value?.setCheckedKeys(ids);
  if (currentForm.value) currentForm.value.access = ids;
};

const clearRoutes = () => {
  treeRef.value?.setCheckedKeys([]);
  if (currentForm.value) currentForm.value.access = [];
};

const updateRouteAccess = () => {
  // 本次修复：程序化渲染树时不写回 formMap，只有用户真实勾选才更新权限。
  if (syncingRouteTree.value || !currentForm.value || !treeRef.value) return;
  currentForm.value.access = treeRef.value.getCheckedKeys();
};

const openRoleDialog = () => {
  roleForm.label = "";
  roleForm.remark = "";
  roleDialogVisible.value = true;
};

const addMockRole = () => {
  roleFormRef.value?.validate(async valid => {
    if (!valid) return;
    const role = props.addRoleApi
      ? toRoleItem((await props.addRoleApi({ name: roleForm.label, remark: roleForm.remark })).data)
      : {
          label: roleForm.label,
          value: `mock-${Date.now()}`,
          remark: roleForm.remark
        };
    mockRoles.value.push(role);
    formMap[String(role.value)] = {
      enabled: true,
      access: [],
      extraPermissions: buildExtraPermissions()
    };
    activeRole.value = String(role.value);
    roleDialogVisible.value = false;
    ElMessage.success(props.addRoleApi ? "角色已添加" : "角色已临时添加，接入新增角色 API 后可保存到后端");
  });
};

const toRoleItem = (role: any): RoleItem => {
  return {
    label: role?.name || roleForm.label,
    value: role?.id || `mock-${Date.now()}`,
    remark: role?.remark || roleForm.remark
  };
};

const buildSavePayload = () => {
  const roleId = activeRole.value;
  // 本次修复：只提交当前正在编辑的角色，避免未编辑角色被空权限覆盖。
  return {
    [roleId]: {
      ...formMap[roleId],
      roleName: displayRoleList.value.find(role => String(role.value) === roleId)?.label
    }
  };
};

const save = async () => {
  if (!activeRole.value || !currentForm.value) return;
  if (currentForm.value.access.length === 0) {
    // 本次修复：清空路由权限属于高风险操作，保存前二次确认。
    await ElMessageBox.confirm(`当前角色「${currentRoleName.value}」没有任何路由权限，确认保存吗？`, "保存确认", {
      type: "warning",
      confirmButtonText: "确认保存",
      cancelButtonText: "取消"
    });
  }
  await props.updateApi(buildSavePayload());
  ElMessage.success("权限已保存");
  emit("saved");
  close();
};

const close = () => emit("update:visible", false);
</script>

<style lang="scss" scoped>
.permission-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-right: 18px;

  h2 {
    margin: 4px 0;
    font-size: 22px;
    font-weight: 700;
    color: #1f2933;
  }

  span {
    color: #64748b;
  }
}

.permission-eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 700;
  color: #0f9f8f;
  letter-spacing: 0;
}

.permission-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 18px;
  min-height: 600px;
}

.role-panel {
  padding: 16px;
  background: linear-gradient(180deg, #f8fbfb 0%, #ffffff 100%);
  border: 1px solid #e5edf0;
  border-radius: 8px;
}

.role-panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: #334155;

  strong {
    color: #0f766e;
  }
}

.role-item {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  text-align: left;
  cursor: pointer;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s ease;

  &.active {
    background: #ecfdf5;
    border-color: #14b8a6;
    box-shadow: 0 8px 18px rgba(20, 184, 166, 0.12);
  }
}

.role-name {
  display: block;
  margin-bottom: 6px;
  font-weight: 700;
  color: #1f2933;
}

.role-meta {
  font-size: 12px;
  color: #64748b;
}

.permission-content {
  min-width: 0;
}

.role-overview {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 20px;
  align-items: center;
  padding: 18px;
  margin-bottom: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  p {
    margin: 0;
    color: #64748b;
  }

  h3 {
    margin: 6px 0 0;
    font-size: 24px;
    color: #111827;
  }
}

.overview-metrics {
  display: flex;
  gap: 10px;

  div {
    min-width: 88px;
    padding: 10px 12px;
    text-align: center;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
  }

  span {
    display: block;
    font-size: 20px;
    font-weight: 700;
    color: #0f766e;
  }
}

.member-section,
.business-permission,
.permission-tabs {
  padding: 16px;
  margin-bottom: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.section-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  span {
    font-weight: 700;
    color: #1f2933;
  }

  em {
    font-size: 12px;
    font-style: normal;
    color: #64748b;
  }
}

.member-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tree-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 700;
  color: #1f2933;
}

.permission-tree {
  max-height: 330px;
  overflow: auto;
  border: 1px solid #edf2f7;
  border-radius: 8px;
}

.permission-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.permission-option {
  display: block;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;

  strong,
  small {
    display: block;
    line-height: 1.6;
  }

  small {
    color: #64748b;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
