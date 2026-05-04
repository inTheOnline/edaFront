<template>
  <el-dialog
    :model-value="modelValue"
    :title="mode === 'create' ? '新增路由' : '编辑路由'"
    width="1240px"
    destroy-on-close
    class="route-editor-dialog"
    @close="emit('update:modelValue', false)"
  >
    <div class="editor-shell">
      <div class="editor-banner" :class="`is-${mode}`">
        <div>
          <strong>{{ mode === "create" ? "新建一条干净的路由记录" : "在确认后修改当前选中节点" }}</strong>
          <p>
            {{ mode === "create" ? "字段会实时生成提交体，方便你边填边核对接口。 " : "会带着当前节点数据进入编辑态，保存时走 /menu/update。" }}
          </p>
        </div>
        <el-tag :type="mode === 'create' ? 'success' : 'warning'" round>
          {{ mode === "create" ? "POST /menu/add" : "POST /menu/update" }}
        </el-tag>
      </div>

      <div class="editor-layout">
        <el-scrollbar class="editor-layout__form">
          <el-form ref="formRef" :model="formModel" :rules="rules" label-position="top" class="route-form">
            <div class="route-form__grid route-form__grid--top">
              <el-form-item label="路由类型" prop="routeType">
                <el-radio-group v-model="formModel.routeType" class="type-group">
                  <el-radio-button label="catalog">目录路由</el-radio-button>
                  <el-radio-button label="page">页面路由</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="父级模块">
                <el-tree-select
                  v-model="formModel.parentKey"
                  :data="parentOptions"
                  check-strictly
                  clearable
                  filterable
                  default-expand-all
                  node-key="value"
                  placeholder="不选则作为顶级路由"
                  :props="{ label: 'label', children: 'children', value: 'value' }"
                />
              </el-form-item>
            </div>

            <div class="route-form__grid">
              <el-form-item label="菜单标题" prop="meta.title">
                <el-input v-model="formModel.meta.title" placeholder="例如：路由管理" />
              </el-form-item>
              <el-form-item label="权限标识" prop="meta.roles">
                <el-input v-model="formModel.meta.roles" placeholder="例如：routeView" />
              </el-form-item>
            </div>

            <div class="route-form__grid">
              <el-form-item label="路由路径" prop="path">
                <el-input v-model="formModel.path" placeholder="例如：/base/routeView" />
              </el-form-item>
              <el-form-item label="重定向地址">
                <el-input v-model="formModel.redirect" placeholder="目录路由可配置，例如：/base/routeView/index" />
              </el-form-item>
            </div>

            <div v-if="formModel.routeType === 'page'" class="route-form__grid">
              <el-form-item label="路由 name" prop="name">
                <el-input v-model="formModel.name" placeholder="例如：routeView" />
              </el-form-item>
              <el-form-item label="组件路径" prop="component">
                <el-input v-model="formModel.component" placeholder="例如：/base/routeView/index" />
              </el-form-item>
            </div>

            <div class="route-form__grid">
              <el-form-item label="菜单 Icon">
                <SelectIcon v-model:icon-value="formModel.meta.icon" placeholder="选择菜单图标" />
              </el-form-item>
              <el-form-item label="排序值">
                <el-input-number v-model="formModel.sort" :min="0" :max="9999" controls-position="right" />
              </el-form-item>
            </div>

            <el-form-item label="描述备注">
              <el-input v-model="formModel.description" type="textarea" :rows="3" placeholder="例如：测试项 / 基础管理下的路由配置页" />
            </el-form-item>

            <div class="switch-grid">
              <el-form-item label="是否隐藏">
                <el-switch v-model="formModel.meta.isHide" />
              </el-form-item>
              <el-form-item label="是否全屏">
                <el-switch v-model="formModel.meta.isFull" />
              </el-form-item>
              <el-form-item label="固定标签">
                <el-switch v-model="formModel.meta.isAffix" />
              </el-form-item>
              <el-form-item label="开启缓存">
                <el-switch v-model="formModel.meta.isKeepAlive" />
              </el-form-item>
            </div>

            <div class="route-form__grid">
              <el-form-item label="外链地址">
                <el-input v-model="formModel.meta.isLink" placeholder="没有外链则留空" />
              </el-form-item>
              <el-form-item label="激活菜单">
                <el-input v-model="formModel.meta.activeMenu" placeholder="例如：/base/project" />
              </el-form-item>
            </div>
          </el-form>
        </el-scrollbar>

        <div class="editor-layout__preview">
          <div class="preview-panel">
            <div class="preview-panel__head">
              <div>
                <strong>{{ previewTitle }}</strong>
                <p>{{ mode === "create" ? "边填边看新增 payload。" : "修改字段会同步刷新 update payload。" }}</p>
              </div>
              <el-tag :type="previewTagType" effect="plain" round>{{ previewTagLabel }}</el-tag>
            </div>

            <el-scrollbar class="preview-panel__body">
              <pre>{{ previewContent }}</pre>
            </el-scrollbar>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="editor-footer">
        <el-button @click="emit('reset')">
          {{ mode === "create" ? "重置草稿" : "还原原始值" }}
        </el-button>
        <el-button @click="emit('update:modelValue', false)">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">
          {{ mode === "create" ? "创建路由" : "保存修改" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import SelectIcon from "@/components/SelectIcon/index.vue";
import { RouteManage } from "@/api/interface/route";

interface RouteOptionNode {
  value: string;
  label: string;
  children?: RouteOptionNode[];
}

interface RouteFormModel {
  parentKey: string;
  routeType: RouteManage.RouteType;
  name: string;
  path: string;
  component: string;
  redirect: string;
  sort: number;
  description: string;
  meta: RouteManage.RouteMeta;
}

const props = defineProps<{
  modelValue: boolean;
  mode: "create" | "edit";
  saving: boolean;
  formModel: RouteFormModel;
  parentOptions: RouteOptionNode[];
  previewTitle: string;
  previewContent: string;
  previewTagLabel: string;
  previewTagType: "success" | "warning" | "info";
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [];
  reset: [];
}>();

const formRef = ref<FormInstance>();

const normalizePath = (value: string) => {
  const raw = value.trim();
  if (!raw) return "";
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const rules: FormRules<RouteFormModel> = {
  routeType: [{ required: true, message: "请选择路由类型", trigger: "change" }],
  path: [
    { required: true, message: "请输入路由路径", trigger: "blur" },
    {
      validator: (_, value, callback) => {
        if (!value) return callback();
        if (!normalizePath(value).startsWith("/")) return callback(new Error("路由路径必须以 / 开头"));
        callback();
      },
      trigger: "blur"
    }
  ],
  name: [
    {
      validator: (_, value, callback) => {
        if (props.formModel.routeType === "page" && !value?.trim()) return callback(new Error("页面路由必须填写 name"));
        callback();
      },
      trigger: "blur"
    }
  ],
  component: [
    {
      validator: (_, value, callback) => {
        if (props.formModel.routeType === "page" && !value?.trim()) return callback(new Error("页面路由必须填写组件路径"));
        callback();
      },
      trigger: "blur"
    }
  ],
  "meta.title": [{ required: true, message: "请输入菜单标题", trigger: "blur" }],
  "meta.roles": [{ required: true, message: "请输入权限标识", trigger: "blur" }]
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  emit("submit");
};

watch(
  () => props.modelValue,
  async value => {
    if (!value) return;
    await nextTick();
    formRef.value?.clearValidate();
  }
);
</script>

<style scoped lang="scss">
.route-editor-dialog {
  :deep(.el-dialog) {
    border: 0;
    border-radius: 28px;
    overflow: hidden;
    background:
      radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.94));
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
  }

  :deep(.el-dialog__header) {
    padding: 22px 24px 0;
    margin-right: 0;
  }

  :deep(.el-dialog__body) {
    padding: 18px 24px 8px;
  }

  :deep(.el-dialog__footer) {
    padding: 8px 24px 24px;
  }
}

.editor-shell {
  display: grid;
  gap: 18px;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
  gap: 18px;
  min-height: 620px;

  &__form,
  &__preview {
    min-height: 0;
  }

  &__form {
    padding-right: 6px;
  }
}

.editor-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.16);

  &.is-create {
    background: linear-gradient(135deg, rgba(12, 74, 110, 0.96), rgba(8, 145, 178, 0.9));
    color: #e0f2fe;
  }

  &.is-edit {
    background: linear-gradient(135deg, rgba(120, 53, 15, 0.95), rgba(217, 119, 6, 0.88));
    color: #fff7ed;
  }

  strong {
    display: block;
    font-size: 16px;
    font-weight: 600;
  }

  p {
    margin: 6px 0 0;
    line-height: 1.6;
  }
}

.route-form {
  display: grid;
  gap: 6px;

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }

  &__grid--top {
    align-items: start;
  }
}

.preview-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  min-height: 620px;
  padding: 18px;
  border-radius: 24px;
  background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
  color: #e5e7eb;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 14px;

    strong {
      display: block;
      font-size: 16px;
    }

    p {
      margin: 6px 0 0;
      color: #94a3b8;
      line-height: 1.6;
    }
  }

  &__body {
    min-height: 0;
  }

  pre {
    margin: 0;
    font-size: 13px;
    line-height: 1.8;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.type-group {
  width: 100%;

  :deep(.el-radio-button__inner) {
    min-width: 112px;
  }
}

.switch-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 900px) {
  .editor-layout,
  .route-form__grid,
  .switch-grid {
    grid-template-columns: 1fr;
  }

  .editor-banner {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview-panel {
    min-height: 280px;
  }
}
</style>
