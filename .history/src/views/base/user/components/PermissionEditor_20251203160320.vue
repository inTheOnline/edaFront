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

      <!-- 右侧权限编辑区 -->
      <el-col :span="18">
        <transition name="fade">
          <el-card
            v-if="activeRole"
            key="permission-panel"
            shadow="hover"
            class="p-2"
          >
            <!-- 🔥 右侧标题 -->
            <h3 class="block-title">
              {{ currentRoleName }} —— 权限编辑
            </h3>

            <!-- 树形权限 -->
            <el-tree
              ref="treeRef"
              :data="menuTree"
              node-key="id"
              show-checkbox
              highlight-current
              :default-checked-keys="formMap[activeRole]?.access"
              :props="{ label: 'label', children: 'children' }"
              class="mt-2"
            />

            <!-- 启用状态 -->
            <div style="margin-top: 20px;">
              <el-switch
                v-model="formMap[activeRole].enabled"
                active-text="启用该角色"
              />
            </div>
          </el-card>
        </transition>
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
import { ref, reactive, watch, nextTick, computed } from "vue";
import { ElMessage } from "element-plus";

interface RoleDto {
  id: number | string; // 与角色 value 严格对应
  enabled: boolean;    // 启用状态
  access?: (number | string)[]; // 权限ID数组（默认选中项）
}

interface RoleItem {
  label: string;
  value: number | string;
}

interface MenuNode {
  id: number | string;
  label: string;
  children?: MenuNode[];
}

const props = withDefaults(defineProps<{
  visible: boolean;
  roleList: RoleItem[];
  menuTree: MenuNode[];
  roleDtoList: RoleDto[];
  updateApi: Function;
}>(), {
  roleList: () => {console.log(roleDtoList)},
  menuTree: () => [],
});

const emit = defineEmits(["update:visible", "saved"]);

const visible = ref(props.visible);
watch(() => props.visible, v => visible.value = v);

// 当前角色
const activeRole = ref<string>("");

// 当前角色名称（右侧标题用）
const currentRoleName = computed(() => {
  return props.roleList.find(r => String(r.value) === activeRole.value)?.label || "";
});

// 权限表单
const formMap = reactive<{ [key: string]: any }>({});

// 初始化角色权限
watch(
  () => props.roleList,
  () => {
    props.roleList.forEach((r) => {
        console.log(props.roleDtoList)
      const dto = props.roleDtoList.find(d => d.id == r.value);

      formMap[r.value] = dto
        ? {
            enabled: dto.enabled,
            access: dto.access || []
          }
        : {
            enabled: true,
            access: []
          };
    });

    // 默认选中第一个角色
    if (!activeRole.value && props.roleList.length > 0) {
      activeRole.value = String(props.roleList[0].value);
    }

    // 树选中
    nextTick(() => {
      const first = activeRole.value;
      treeRef.value?.setCheckedKeys(formMap[first]?.access || []);
    });
  },
  { immediate: true }
);

const treeRef = ref();

// 切换角色 → 附带动画
const switchRole = async (roleValue: string) => {
  activeRole.value = roleValue;

  await nextTick();
  treeRef.value?.setCheckedKeys(formMap[roleValue]?.access || []);
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

const close = () => emit("update:visible", false);
</script>

<style scoped>
.role-menu {
  height: 400px;
  overflow-y: auto;
}

.p-2 {
  padding: 10px;
}

.block-title {
  font-size: 18px;
  margin-bottom: 10px;
  font-weight: 600;
}

/* 淡入动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
