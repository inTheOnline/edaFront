<template>
  <el-dialog
    v-model="visible"
    title="权限编辑"
    width="60%"
    destroy-on-close
  >
    <el-row>
      <!-- 左侧角色列表 -->
      <el-col :span="6">
        <el-card shadow="hover" class="p-2">
          <el-menu
            :default-active="activeRole"
            @select="switchRole"
            class="role-menu"
          >
            <el-menu-item
              v-for="r in roleList"
              :key="r.value"
              :index="String(r.value)"
            >
              {{ r.label }}
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>

      <!-- 右侧权限树 -->
      <el-col :span="18">
        <el-card shadow="hover" class="p-2">
          <el-tree
            ref="treeRef"
            :data="menuTree"
            node-key="id"
            show-checkbox
            highlight-current
            :default-checked-keys="formMap[activeRole]?.access"
            :props="{ label: 'label', children: 'children' }"
          />

          <!-- 是否启用 -->
          <div style="margin-top: 20px;">
            <el-switch
              v-model="formMap[activeRole].enabled"
              active-text="启用该角色"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";

interface RoleItem {
  label: string;
  value: number | string;
}

interface MenuNode {
  id: number | string;
  label: string;
  children?: MenuNode[];
}

const props = defineProps<{
  visible: boolean;                 // 外部控制弹窗开关
  roleList: RoleItem[];             // 角色列表（来自 dictStore.dictMap['role']）
  menuTree: MenuNode[];             // 树形权限菜单
  updateApi: Function;              // 保存权限的 API 方法
}>();

const emit = defineEmits(["update:visible", "saved"]);

const visible = ref(props.visible);
watch(
  () => props.visible,
  v => (visible.value = v)
);

// 当前选择角色
const activeRole = ref<string>("");

// 每个角色对应的权限
const formMap = reactive<{ [key: string]: any }>({});

watch(
  () => props.roleList,
  (roles) => {
    roles.forEach((r) => {
      if (!formMap[r.value]) {
        formMap[r.value] = {
          enabled: true,
          access: []
        };
      }
    });

    if (!activeRole.value && roles.length > 0) {
      activeRole.value = String(roles[0].value);
    }
  },
  { immediate: true }
);

// 切换角色
const treeRef = ref();
const switchRole = async (roleValue: string) => {
  activeRole.value = roleValue;

  await nextTick();
  treeRef.value.setCheckedKeys(formMap[roleValue].access);
};

// 保存
const save = async () => {
  const checkedKeys = treeRef.value.getCheckedKeys();
  formMap[activeRole.value].access = checkedKeys;

  await props.updateApi(formMap);
  ElMessage.success("权限已保存！");
  emit("saved", formMap);
  close();
};

const close = () => {
  emit("update:visible", false);
};
</script>

<style scoped>
.role-menu {
  height: 400px;
  overflow-y: auto;
}

.p-2 {
  padding: 10px;
}
</style>
