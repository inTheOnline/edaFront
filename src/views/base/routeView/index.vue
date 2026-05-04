<template>
  <div class="route-page">
    <section class="hero">
      <div class="hero__aurora hero__aurora--one"></div>
      <div class="hero__aurora hero__aurora--two"></div>

      <div class="hero__content">
        <div class="hero__copy">
          <span class="hero__eyebrow">Route Studio</span>
          <h2>路由编排台</h2>
          <p>
            左侧维护树形拓扑，右侧锁定当前节点详情。新增、编辑、删除都收进确认后的弹窗流程里，页面本身只保留高频查看和拖拽操作。
          </p>
        </div>

        <div class="hero__stats">
          <div class="stat-chip">
            <span>总节点</span>
            <strong>{{ metrics.total }}</strong>
          </div>
          <div class="stat-chip">
            <span>目录</span>
            <strong>{{ metrics.catalog }}</strong>
          </div>
          <div class="stat-chip">
            <span>页面</span>
            <strong>{{ metrics.page }}</strong>
          </div>
          <div class="stat-chip" :class="{ 'is-live': apiMode === 'live' }">
            <span>数据源</span>
            <strong>{{ apiMode === "live" ? "接口模式" : "回退快照" }}</strong>
          </div>
        </div>
      </div>

      <div class="hero__actions">
        <el-button type="primary" :icon="CirclePlus" @click="openCreateDialog">新增路由</el-button>
        <el-button :icon="Refresh" @click="loadRouteTree()">刷新路由树</el-button>
      </div>
    </section>

    <el-alert
      v-if="apiMode === 'fallback'"
      class="mode-alert"
      title="当前展示的是前端回退快照。请求预览和按钮仍然会保留，方便继续联调后端。"
      type="warning"
      :closable="false"
      show-icon
    />

    <section class="workspace">
      <el-card class="panel panel--tree" shadow="hover">
        <template #header>
          <div class="panel-header">
            <div>
              <strong>路由树</strong>
              <p>拖到同级区域会显示水平插入线，拖到目录节点上会高亮并变成它的子节点。</p>
            </div>
            <div class="panel-header__actions">
              <el-button :icon="Expand" @click="expandAllNodes">展开全部</el-button>
              <el-button :icon="Fold" @click="expandTopLevelNodes">仅顶级</el-button>
            </div>
          </div>
        </template>

        <div class="tree-toolbar">
          <div class="tree-toolbar__left">
            <el-icon><Sort /></el-icon>
            <span>支持顶级排序、同级排序、跨目录拖拽挂载</span>
          </div>
          <div class="tree-toolbar__right">
            <span>当前选中</span>
            <strong>{{ selectedNodeLabel }}</strong>
          </div>
        </div>

        <el-scrollbar class="tree-scroll">
          <div v-loading="loading" class="tree-shell">
            <RouteTopologyBranch
              :nodes="treeData"
              :expanded-keys="expandedKeys"
              :dragged-key="draggedKey"
              :child-hover-key="childHoverKey"
              :selected-key="selectedKey"
              @toggle-node="toggleNode"
              @select-node="selectNode"
              @drag-start="handleDragStart"
              @sort-end="handleSortEnd"
              @child-hover="setChildHoverKey"
              @drop-as-child="handleDropAsChild"
            />
          </div>
        </el-scrollbar>
      </el-card>

      <div class="detail-stage">
        <el-card class="panel panel--detail" shadow="hover">
          <div v-if="selectedNode" class="detail-card">
            <div class="detail-card__hero">
              <div class="detail-card__icon">
                <el-icon>
                  <component :is="selectedNode.meta.icon || 'Grid'" />
                </el-icon>
              </div>

              <div class="detail-card__copy">
                <div class="detail-card__headline">
                  <h3>{{ selectedNode.meta.title || selectedNode.name || selectedNode.path }}</h3>
                  <el-tag :type="selectedNode.routeType === 'catalog' ? 'warning' : 'success'" effect="plain" round>
                    {{ selectedNode.routeType === "catalog" ? "目录" : "页面" }}
                  </el-tag>
                </div>
                <p>{{ selectedNode.path }}</p>
                <div class="detail-card__chips">
                  <span>{{ selectedNode.meta.roles || "未配置权限标识" }}</span>
                  <span>排序 {{ selectedNode.sort ?? 0 }}</span>
                  <span>{{ selectedNode.meta.icon || "未选图标" }}</span>
                </div>
              </div>

              <div class="detail-card__actions">
                <el-button :icon="EditPen" @click="handleEditClick">编辑</el-button>
                <el-button type="danger" plain :icon="Delete" @click="handleDeleteClick">删除</el-button>
              </div>
            </div>

            <div class="detail-grid">
              <div v-for="item in detailRows" :key="item.label" class="detail-cell">
                <span class="detail-cell__label">{{ item.label }}</span>
                <strong class="detail-cell__value">{{ item.value || "—" }}</strong>
              </div>
            </div>

            <div class="detail-flags">
              <div class="flag-item" :class="{ active: !!selectedNode.meta.isKeepAlive }">
                <span>缓存</span>
                <strong>{{ selectedNode.meta.isKeepAlive ? "开启" : "关闭" }}</strong>
              </div>
              <div class="flag-item" :class="{ active: !!selectedNode.meta.isHide }">
                <span>隐藏</span>
                <strong>{{ selectedNode.meta.isHide ? "是" : "否" }}</strong>
              </div>
              <div class="flag-item" :class="{ active: !!selectedNode.meta.isFull }">
                <span>全屏</span>
                <strong>{{ selectedNode.meta.isFull ? "是" : "否" }}</strong>
              </div>
              <div class="flag-item" :class="{ active: !!selectedNode.meta.isAffix }">
                <span>固定标签</span>
                <strong>{{ selectedNode.meta.isAffix ? "是" : "否" }}</strong>
              </div>
            </div>

            <div class="meta-spotlight">
              <div v-for="item in metaHighlights" :key="item.label" class="meta-spotlight__item">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>

            <div class="guide-panel">
              <div class="guide-panel__header">
                <strong>路由说明</strong>
                <span>字段解释与操作提示</span>
              </div>

              <div class="guide-grid">
                <div v-for="item in guideCards" :key="item.title" class="guide-card">
                  <span class="guide-card__label">{{ item.title }}</span>
                  <p>{{ item.content }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <el-icon><Connection /></el-icon>
            <strong>先从左侧选中一个节点</strong>
            <p>右侧会展示当前节点的只读详情，编辑和删除都需要你二次确认后才会进入下一步。</p>
          </div>
        </el-card>
      </div>
    </section>

    <RouteEditorDialog
      v-model="editorVisible"
      :mode="editorMode"
      :saving="editorSaving"
      :form-model="editorForm"
      :parent-options="parentOptions"
      :preview-title="editorPreviewTitle"
      :preview-content="editorPreviewContent"
      :preview-tag-label="editorPreviewTagLabel"
      :preview-tag-type="editorPreviewTagType"
      @submit="submitEditor"
      @reset="resetEditorForm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  CirclePlus,
  Connection,
  Delete,
  EditPen,
  Expand,
  Fold,
  Refresh,
  Sort
} from "@element-plus/icons-vue";
import authMenuSeed from "@/assets/json/authMenuList.json";
import { useAuthStore } from "@/stores/modules/auth";
import { createRoute, deleteRoute, getRouteTree, moveRoute, updateRoute } from "@/api/modules/system/route";
import { RouteManage } from "@/api/interface/route";
import RouteEditorDialog from "./components/RouteEditorDialog.vue";
import RouteTopologyBranch from "./components/RouteTopologyBranch.vue";

interface RouteTreeViewNode extends RouteManage.RouteTreeNode {
  nodeKey: string;
  routeType: RouteManage.RouteType;
  children?: RouteTreeViewNode[];
}

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

interface RouteLocation {
  node: RouteTreeViewNode;
  parent: RouteTreeViewNode | null;
  index: number;
  siblings: RouteTreeViewNode[];
}

interface DragState {
  nodeKey: string;
  fromParentKey: string | null;
  fromIndex: number;
}

const authStore = useAuthStore();
const loading = ref(false);
const editorSaving = ref(false);
const apiMode = ref<"live" | "fallback">("live");
const treeData = ref<RouteTreeViewNode[]>([]);
const expandedKeys = ref<string[]>([]);
const selectedKey = ref("");
const draggedKey = ref("");
const childHoverKey = ref("");
const editorVisible = ref(false);
const editorMode = ref<"create" | "edit">("create");
const lastResult = ref("暂无请求结果");
const lastSubmitStatus = ref<"success" | "fallback">("fallback");
const suppressNextSortEnd = ref(false);
const dragState = reactive<DragState>({
  nodeKey: "",
  fromParentKey: null,
  fromIndex: -1
});

const createDefaultForm = (): RouteFormModel => ({
  parentKey: "",
  routeType: "page",
  name: "",
  path: "",
  component: "",
  redirect: "",
  sort: 100,
  description: "",
  meta: {
    title: "",
    icon: "Connection",
    roles: "",
    activeMenu: "",
    isLink: "",
    isHide: false,
    isFull: false,
    isAffix: false,
    isKeepAlive: true
  }
});

const editorForm = reactive<RouteFormModel>(createDefaultForm());
const selectedSnapshot = ref<RouteManage.UpdateRoutePayload | null>(null);

const normalizePath = (value: string) => {
  const raw = value?.trim() ?? "";
  if (!raw) return "";
  return raw.startsWith("/") ? raw : `/${raw}`;
};

const createRouteName = (path: string) => {
  const source =
    path
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/[-_](\w)/g, (_, part: string) => part.toUpperCase()) ?? "";
  return source || "routeView";
};

const buildTree = (nodes: RouteManage.RouteTreeNode[] = [], level = 1): RouteTreeViewNode[] => {
  return nodes.map((node, index) => {
    const nodePath = normalizePath(node.path) || `/${level}-${index}`;
    const nodeKey = String(node.id ?? nodePath);
    const hasChildren = !!node.children?.length;
    return {
      ...node,
      path: nodePath,
      nodeKey,
      routeType: node.routeType ?? (hasChildren || !node.component ? "catalog" : "page"),
      children: buildTree(node.children ?? [], level + 1)
    };
  });
};

const getFallbackTree = () => {
  const source = authStore.authMenuListGet.length
    ? JSON.parse(JSON.stringify(authStore.authMenuListGet))
    : JSON.parse(JSON.stringify(authMenuSeed.data));
  return buildTree(source as RouteManage.RouteTreeNode[]);
};

const flattenTree = (nodes: RouteTreeViewNode[], bucket: RouteTreeViewNode[] = []) => {
  nodes.forEach(node => {
    bucket.push(node);
    if (node.children?.length) flattenTree(node.children, bucket);
  });
  return bucket;
};

const collectCatalogKeys = (nodes: RouteTreeViewNode[], bucket: string[] = []) => {
  nodes.forEach(node => {
    if (node.routeType === "catalog") bucket.push(node.nodeKey);
    if (node.children?.length) collectCatalogKeys(node.children, bucket);
  });
  return bucket;
};

const collectTopLevelCatalogKeys = (nodes: RouteTreeViewNode[]) => {
  return nodes.filter(node => node.routeType === "catalog").map(node => node.nodeKey);
};

const flatNodes = computed(() => flattenTree(treeData.value));

const nodeMap = computed(() => {
  return flatNodes.value.reduce<Record<string, RouteTreeViewNode>>((acc, item) => {
    acc[item.nodeKey] = item;
    return acc;
  }, {});
});

const selectedNode = computed(() => nodeMap.value[selectedKey.value] ?? null);

const selectedNodeLabel = computed(() => {
  return selectedNode.value?.meta.title || selectedNode.value?.name || selectedNode.value?.path || "未选中";
});

const parentOptions = computed<RouteOptionNode[]>(() => {
  const createOptions = (nodes: RouteTreeViewNode[]): RouteOptionNode[] => {
    return nodes
      .filter(node => node.routeType === "catalog")
      .map(node => ({
        value: node.nodeKey,
        label: `${node.meta.title || node.name || node.path} · ${node.path}`,
        children: createOptions(node.children ?? [])
      }));
  };
  return createOptions(treeData.value);
});

const selectedParent = computed(() => {
  return editorForm.parentKey ? nodeMap.value[editorForm.parentKey] ?? null : null;
});

const selectedNodeParent = computed(() => {
  if (!selectedNode.value) return null;
  return findNodeLocation(treeData.value, selectedNode.value.nodeKey)?.parent ?? null;
});

const metrics = computed(() => {
  return flatNodes.value.reduce(
    (acc, item) => {
      acc.total += 1;
      if (item.routeType === "catalog") acc.catalog += 1;
      if (item.routeType === "page") acc.page += 1;
      return acc;
    },
    { total: 0, catalog: 0, page: 0 }
  );
});

const detailRows = computed(() => {
  if (!selectedNode.value) return [];
  const node = selectedNode.value;
  return [
    { label: "名称", value: node.name || "目录路由可为空" },
    { label: "路径", value: node.path },
    { label: "组件", value: node.component || "目录路由可为空" },
    { label: "父级", value: selectedNodeParent.value?.meta.title || selectedNodeParent.value?.path || "顶级路由" },
    { label: "重定向", value: node.redirect || "未配置" },
    { label: "激活菜单", value: node.meta.activeMenu || "未配置" },
    { label: "外链地址", value: node.meta.isLink || "未配置" },
    { label: "备注", value: node.description || "未填写" }
  ];
});

const metaHighlights = computed(() => {
  if (!selectedNode.value) return [];
  const node = selectedNode.value;
  return [
    { label: "菜单图标", value: node.meta.icon || "未选择" },
    { label: "权限标识", value: node.meta.roles || "未配置" },
    { label: "激活菜单", value: node.meta.activeMenu || "未配置" },
    { label: "外链地址", value: node.meta.isLink || "未配置" }
  ];
});

const guideCards = computed(() => {
  if (!selectedNode.value) return [];
  const node = selectedNode.value;
  const routeExplain =
    node.routeType === "catalog"
      ? "目录路由主要用来承载子节点和菜单分组，本身可以没有组件路径，但更适合配置 redirect 和层级结构。"
      : "页面路由会直接映射到组件文件，name 和 component 建议保持稳定，避免影响缓存和菜单高亮。";
  const fieldExplain = node.meta.isHide
    ? "当前节点是隐藏路由，通常需要配合 activeMenu 使用，这样进入详情页或编辑页时左侧菜单还能保持正确高亮。"
    : "当前节点会直接参与菜单展示，roles 会影响权限控制，icon 与 title 会直接体现在左侧菜单和标签页上。";
  const actionExplain =
    "拖拽到同级区域是排序，拖拽到目录节点高亮区是挂到它下面；编辑和删除都需要二次确认，避免误操作直接落库。";

  return [
    { title: "节点用途", content: routeExplain },
    { title: "字段解释", content: fieldExplain },
    { title: "操作提示", content: actionExplain }
  ];
});

const buildCreatePayload = (form: RouteFormModel): RouteManage.CreateRoutePayload => {
  const payload: RouteManage.CreateRoutePayload = {
    parentId: selectedParent.value?.id ?? selectedParent.value?.nodeKey ?? null,
    parentPath: selectedParent.value?.path ?? "",
    routeType: form.routeType,
    path: normalizePath(form.path),
    redirect: form.redirect.trim(),
    sort: form.sort,
    description: form.description.trim(),
    meta: {
      title: form.meta.title.trim(),
      icon: form.meta.icon.trim(),
      roles: form.meta.roles.trim(),
      activeMenu: form.meta.activeMenu?.trim(),
      isLink: form.meta.isLink?.trim(),
      isHide: form.meta.isHide,
      isFull: form.meta.isFull,
      isAffix: form.meta.isAffix,
      isKeepAlive: form.meta.isKeepAlive
    }
  };

  if (form.routeType === "page") {
    payload.name = form.name.trim();
    payload.component = form.component.trim();
  }

  if (!payload.redirect) delete payload.redirect;
  if (!payload.description) delete payload.description;
  if (!payload.meta.activeMenu) delete payload.meta.activeMenu;
  if (!payload.meta.isLink) delete payload.meta.isLink;
  if (!payload.parentPath) delete payload.parentPath;

  return payload;
};

const buildUpdatePayloadFromNode = (node: RouteTreeViewNode): RouteManage.UpdateRoutePayload => {
  const location = findNodeLocation(treeData.value, node.nodeKey);
  const parent = location?.parent ?? null;
  const payload: RouteManage.UpdateRoutePayload = {
    id: node.id ?? node.nodeKey,
    parentId: parent?.id ?? parent?.nodeKey ?? null,
    parentPath: parent?.path ?? "",
    routeType: node.routeType,
    name: node.name || "",
    path: node.path,
    component: node.component || "",
    redirect: node.redirect || "",
    sort: node.sort ?? 0,
    description: node.description || "",
    meta: {
      title: node.meta.title || "",
      icon: node.meta.icon || "",
      roles: node.meta.roles || "",
      activeMenu: node.meta.activeMenu || "",
      isLink: node.meta.isLink || "",
      isHide: !!node.meta.isHide,
      isFull: !!node.meta.isFull,
      isAffix: !!node.meta.isAffix,
      isKeepAlive: !!node.meta.isKeepAlive
    }
  };

  if (!payload.parentPath) delete payload.parentPath;
  if (!payload.redirect) delete payload.redirect;
  if (!payload.description) delete payload.description;
  if (!payload.meta.activeMenu) delete payload.meta.activeMenu;
  if (!payload.meta.isLink) delete payload.meta.isLink;
  if (payload.routeType === "catalog") {
    delete payload.name;
    delete payload.component;
  }

  return payload;
};

const buildUpdatePayloadFromForm = (): RouteManage.UpdateRoutePayload | null => {
  if (!selectedSnapshot.value) return null;
  const payload: RouteManage.UpdateRoutePayload = {
    ...buildCreatePayload(editorForm),
    id: selectedSnapshot.value.id
  };
  return payload;
};

const draftPreview = computed(() => JSON.stringify(buildCreatePayload(editorForm), null, 2));
const selectedPreview = computed(() =>
  selectedNode.value ? JSON.stringify(buildUpdatePayloadFromNode(selectedNode.value), null, 2) : "请先在左侧选中一个节点"
);

const editorPreviewTitle = computed(() => {
  return editorMode.value === "create" ? "新增路由 payload" : "编辑路由 payload";
});

const editorPreviewContent = computed(() => {
  return editorMode.value === "create"
    ? draftPreview.value
    : buildUpdatePayloadFromForm()
      ? JSON.stringify(buildUpdatePayloadFromForm(), null, 2)
      : selectedPreview.value;
});

const editorPreviewTagLabel = computed(() => {
  return editorMode.value === "create" ? "POST /menu/add" : "POST /menu/update";
});

const editorPreviewTagType = computed<"success" | "warning" | "info">(() => {
  return editorMode.value === "create" ? "success" : "warning";
});

const findNodeLocation = (
  nodes: RouteTreeViewNode[],
  nodeKey: string,
  parent: RouteTreeViewNode | null = null
): RouteLocation | null => {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.nodeKey === nodeKey) return { node, parent, index, siblings: nodes };
    if (node.children?.length) {
      const childResult = findNodeLocation(node.children, nodeKey, node);
      if (childResult) return childResult;
    }
  }
  return null;
};

const containsNode = (node: RouteTreeViewNode, targetKey: string): boolean => {
  if (node.nodeKey === targetKey) return true;
  return node.children?.some(child => containsNode(child, targetKey)) ?? false;
};

const collectAncestorKeys = (nodes: RouteTreeViewNode[], nodeKey: string, path: string[] = []): string[] => {
  for (const node of nodes) {
    const nextPath = [...path, node.nodeKey];
    if (node.nodeKey === nodeKey) return nextPath.slice(0, -1);
    if (node.children?.length) {
      const result = collectAncestorKeys(node.children, nodeKey, nextPath);
      if (result.length) return result;
    }
  }
  return [];
};

const syncTreeStructure = (nodes: RouteTreeViewNode[], parent: RouteTreeViewNode | null = null) => {
  nodes.forEach((node, index) => {
    node.parentId = parent?.id ?? parent?.nodeKey ?? null;
    node.sort = (index + 1) * 10;
    if (node.children?.length) syncTreeStructure(node.children, node);
  });
};

const resolveSortForLocation = (location: RouteLocation) => {
  const previousNode = location.siblings[location.index - 1];
  const nextNode = location.siblings[location.index + 1];
  const previousSort = typeof previousNode?.sort === "number" ? previousNode.sort : null;
  const nextSort = typeof nextNode?.sort === "number" ? nextNode.sort : null;

  if (previousSort == null && nextSort == null) return 10;
  if (previousSort == null && nextSort != null) return nextSort - 10;
  if (previousSort != null && nextSort == null) return previousSort + 10;
  if (previousSort != null && nextSort != null) {
    const gap = nextSort - previousSort;
    if (gap > 1) return previousSort + Math.floor(gap / 2);
    return previousSort + 1;
  }

  return location.node.sort ?? (location.index + 1) * 10;
};

const cleanupDragState = () => {
  draggedKey.value = "";
  childHoverKey.value = "";
  dragState.nodeKey = "";
  dragState.fromParentKey = null;
  dragState.fromIndex = -1;
};

const ensureSelection = (preferredKey?: string, preferredId?: RouteManage.RouteId | null) => {
  const matchedById =
    preferredId == null ? null : flatNodes.value.find(item => String(item.id ?? item.nodeKey) === String(preferredId)) ?? null;
  const matchedKey = preferredKey ? nodeMap.value[preferredKey] ?? null : null;
  const nextNode = matchedById ?? matchedKey ?? flatNodes.value[0] ?? null;
  selectedKey.value = nextNode?.nodeKey ?? "";
  if (nextNode) {
    const ancestors = collectAncestorKeys(treeData.value, nextNode.nodeKey);
    expandedKeys.value = Array.from(new Set([...expandedKeys.value, ...ancestors]));
  }
};

const expandAllNodes = () => {
  expandedKeys.value = collectCatalogKeys(treeData.value);
};

const expandTopLevelNodes = () => {
  expandedKeys.value = collectTopLevelCatalogKeys(treeData.value);
};

const toggleNode = (nodeKey: string) => {
  if (expandedKeys.value.includes(nodeKey)) {
    expandedKeys.value = expandedKeys.value.filter(item => item !== nodeKey);
  } else {
    expandedKeys.value = [...expandedKeys.value, nodeKey];
  }
};

const selectNode = (nodeKey: string) => {
  selectedKey.value = nodeKey;
};

const setChildHoverKey = (nodeKey: string) => {
  childHoverKey.value = nodeKey;
};

const loadRouteTree = async (options: { preferredKey?: string; preferredId?: RouteManage.RouteId | null } = {}) => {
  loading.value = true;
  try {
    const { data } = await getRouteTree();
    treeData.value = buildTree(data);
    apiMode.value = "live";
  } catch (error) {
    treeData.value = getFallbackTree();
    apiMode.value = "fallback";
  } finally {
    if (!expandedKeys.value.length) expandTopLevelNodes();
    ensureSelection(options.preferredKey ?? selectedKey.value, options.preferredId);
    loading.value = false;
  }
};

const fillEditorForm = (payload: RouteManage.UpdateRoutePayload | RouteManage.CreateRoutePayload, parentKey = "") => {
  Object.assign(editorForm, createDefaultForm(), {
    parentKey,
    routeType: payload.routeType,
    name: payload.name || "",
    path: payload.path || "",
    component: payload.component || "",
    redirect: payload.redirect || "",
    sort: payload.sort ?? 100,
    description: payload.description || "",
    meta: {
      title: payload.meta.title || "",
      icon: payload.meta.icon || "Connection",
      roles: payload.meta.roles || "",
      activeMenu: payload.meta.activeMenu || "",
      isLink: payload.meta.isLink || "",
      isHide: !!payload.meta.isHide,
      isFull: !!payload.meta.isFull,
      isAffix: !!payload.meta.isAffix,
      isKeepAlive: !!payload.meta.isKeepAlive
    }
  });
};

const openCreateDialog = () => {
  editorMode.value = "create";
  selectedSnapshot.value = null;
  Object.assign(editorForm, createDefaultForm());
  editorVisible.value = true;
};

const handleEditClick = async () => {
  if (!selectedNode.value) {
    ElMessage.warning("请先选中一个节点");
    return;
  }

  try {
    await ElMessageBox.confirm("将进入当前节点的编辑态，只有在弹窗里再次保存才会真的修改。", "确认编辑", {
      type: "warning",
      confirmButtonText: "进入编辑",
      cancelButtonText: "取消"
    });
  } catch (error) {
    return;
  }

  editorMode.value = "edit";
  const payload = buildUpdatePayloadFromNode(selectedNode.value);
  selectedSnapshot.value = JSON.parse(JSON.stringify(payload));
  fillEditorForm(payload, selectedNodeParent.value?.nodeKey ?? "");
  editorVisible.value = true;
};

const handleDeleteClick = async () => {
  if (!selectedNode.value) {
    ElMessage.warning("请先选中一个节点");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `删除后将直接调用 /menu/delete，当前节点“${selectedNode.value.meta.title || selectedNode.value.path}”会从路由树中移除。`,
      "确认删除",
      {
        type: "warning",
        confirmButtonText: "确认删除",
        cancelButtonText: "取消"
      }
    );
  } catch (error) {
    return;
  }

  const payload: RouteManage.DeleteRoutePayload = {
    id: selectedNode.value.id ?? selectedNode.value.nodeKey
  };

  try {
    const { data } = await deleteRoute(payload);
    lastResult.value = JSON.stringify({ action: "delete", payload, result: data }, null, 2);
    lastSubmitStatus.value = "success";
    ElMessage.success("路由已删除");
    selectedKey.value = "";
    await loadRouteTree();
  } catch (error: any) {
    lastResult.value = JSON.stringify({ action: "delete", payload, error: error?.message || "delete failed" }, null, 2);
    lastSubmitStatus.value = "fallback";
    ElMessage.warning(error?.message || "删除失败，请检查后端返回");
  }
};

const resetEditorForm = () => {
  if (editorMode.value === "edit" && selectedSnapshot.value) {
    fillEditorForm(selectedSnapshot.value, selectedNodeParent.value?.nodeKey ?? "");
    return;
  }
  Object.assign(editorForm, createDefaultForm());
};

const submitEditor = async () => {
  editorSaving.value = true;
  try {
    if (editorMode.value === "create") {
      const payload = buildCreatePayload(editorForm);
      const { data } = await createRoute(payload);
      lastResult.value = JSON.stringify({ action: "create", payload, result: data }, null, 2);
      lastSubmitStatus.value = "success";
      ElMessage.success("路由已创建");
      editorVisible.value = false;
      await loadRouteTree({ preferredId: data?.id ?? null });
      return;
    }

    const payload = buildUpdatePayloadFromForm();
    if (!payload) return;
    const { data } = await updateRoute(payload);
    lastResult.value = JSON.stringify({ action: "update", payload, result: data }, null, 2);
    lastSubmitStatus.value = "success";
    ElMessage.success("路由已更新");
    editorVisible.value = false;
    await loadRouteTree({ preferredId: payload.id });
  } catch (error: any) {
    const action = editorMode.value === "create" ? "create" : "update";
    const payload = editorMode.value === "create" ? buildCreatePayload(editorForm) : buildUpdatePayloadFromForm();
    lastResult.value = JSON.stringify({ action, payload, error: error?.message || `${action} failed` }, null, 2);
    lastSubmitStatus.value = "fallback";
    ElMessage.warning(error?.message || "接口请求失败，请检查后端返回");
  } finally {
    editorSaving.value = false;
  }
};

const persistMove = async (
  movedNode: RouteTreeViewNode,
  previousParent: RouteTreeViewNode | null,
  nextParent: RouteTreeViewNode | null
) => {
  const payload: RouteManage.MoveRoutePayload = {
    id: movedNode.id ?? movedNode.nodeKey,
    parentId: nextParent?.id ?? nextParent?.nodeKey ?? null,
    parentPath: nextParent?.path ?? "",
    previousParentId: previousParent?.id ?? previousParent?.nodeKey ?? null,
    previousParentPath: previousParent?.path ?? "",
    sort: movedNode.sort ?? 0,
    path: movedNode.path
  };

  try {
    const { data } = await moveRoute(payload);
    lastResult.value = JSON.stringify({ action: "move", payload, result: data }, null, 2);
    lastSubmitStatus.value = "success";
    ElMessage.success("路由拓扑已更新");
    await loadRouteTree({ preferredId: payload.id });
  } catch (error: any) {
    lastResult.value = JSON.stringify({ action: "move", payload, error: error?.message || "move failed" }, null, 2);
    lastSubmitStatus.value = "fallback";
    ElMessage.warning(error?.message || "移动请求未成功落库");
  }
};

const handleDragStart = ({ nodeKey, parentKey }: { nodeKey: string; parentKey: string | null }) => {
  const location = findNodeLocation(treeData.value, nodeKey);
  if (!location) return;
  draggedKey.value = nodeKey;
  childHoverKey.value = "";
  dragState.nodeKey = nodeKey;
  dragState.fromParentKey = parentKey;
  dragState.fromIndex = location.index;
};

const handleSortEnd = async ({ nodeKey }: { nodeKey: string }) => {
  childHoverKey.value = "";
  if (!nodeKey || !dragState.nodeKey) {
    cleanupDragState();
    return;
  }

  if (suppressNextSortEnd.value) {
    suppressNextSortEnd.value = false;
    cleanupDragState();
    return;
  }

  await nextTick();
  const currentLocation = findNodeLocation(treeData.value, nodeKey);
  if (!currentLocation) {
    cleanupDragState();
    return;
  }

  const sameParent = (dragState.fromParentKey ?? null) === (currentLocation.parent?.nodeKey ?? null);
  const sameIndex = dragState.fromIndex === currentLocation.index;
  if (sameParent && sameIndex) {
    cleanupDragState();
    return;
  }

  currentLocation.node.sort = resolveSortForLocation(currentLocation);
  const previousParent = dragState.fromParentKey ? nodeMap.value[dragState.fromParentKey] ?? null : null;
  await persistMove(currentLocation.node, previousParent, currentLocation.parent);
  cleanupDragState();
};

const handleDropAsChild = async (parentKey: string) => {
  if (!draggedKey.value) return;

  const sourceLocation = findNodeLocation(treeData.value, draggedKey.value);
  const targetLocation = findNodeLocation(treeData.value, parentKey);
  if (!sourceLocation || !targetLocation) {
    cleanupDragState();
    return;
  }

  if (draggedKey.value === parentKey) {
    ElMessage.warning("不能把节点拖到自己下面");
    cleanupDragState();
    return;
  }

  if (targetLocation.node.routeType !== "catalog") {
    ElMessage.warning("当前只允许挂到目录路由下");
    cleanupDragState();
    return;
  }

  if (containsNode(sourceLocation.node, parentKey)) {
    ElMessage.warning("不能把父节点拖到自己的子节点下面");
    cleanupDragState();
    return;
  }

  const previousParent = sourceLocation.parent;
  const movedNode = sourceLocation.siblings.splice(sourceLocation.index, 1)[0];
  if (!targetLocation.node.children) targetLocation.node.children = [];
  targetLocation.node.children.push(movedNode);

  if (!expandedKeys.value.includes(targetLocation.node.nodeKey)) {
    expandedKeys.value = [...expandedKeys.value, targetLocation.node.nodeKey];
  }

  const movedLocation = findNodeLocation(treeData.value, movedNode.nodeKey);
  if (movedLocation) movedNode.sort = resolveSortForLocation(movedLocation);
  suppressNextSortEnd.value = true;
  childHoverKey.value = "";
  await persistMove(movedNode, previousParent, targetLocation.node);
  cleanupDragState();
};

watch(
  () => editorForm.path,
  value => {
    if (editorForm.routeType === "page" && !editorForm.name.trim() && value.trim()) {
      editorForm.name = createRouteName(normalizePath(value));
    }
    if (editorForm.routeType === "page" && !editorForm.component.trim() && value.trim()) {
      editorForm.component = `${normalizePath(value)}/index`;
    }
  }
);

watch(
  () => editorForm.routeType,
  value => {
    if (value === "catalog") {
      editorForm.name = "";
      editorForm.component = "";
      editorForm.meta.isKeepAlive = false;
    } else if (!editorForm.meta.isLink) {
      editorForm.meta.isKeepAlive = true;
    }
  }
);

watch(selectedParent, value => {
  if (!value || editorMode.value !== "create") return;
  if (!editorForm.meta.roles) editorForm.meta.roles = value.meta.roles;
  if (!editorForm.meta.icon) editorForm.meta.icon = value.meta.icon;
});

onMounted(() => {
  Object.assign(editorForm, createDefaultForm());
  loadRouteTree();
});
</script>

<style scoped lang="scss">
.route-page {
  --workspace-panel-height: clamp(700px, calc(100vh - 250px), 940px);
  display: grid;
  gap: 16px;
  min-height: calc(100vh - 110px);
  padding: 18px;
  background:
    radial-gradient(circle at top left, rgba(186, 230, 253, 0.48), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #eef4ff 38%, #f8fafc 100%);
}

.hero {
  position: relative;
  display: grid;
  gap: 18px;
  overflow: hidden;
  padding: 24px 26px;
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(3, 105, 161, 0.92) 55%, rgba(14, 116, 144, 0.88)),
    #0f172a;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.16);
  color: #e2e8f0;

  &__aurora {
    position: absolute;
    border-radius: 999px;
    filter: blur(6px);
    opacity: 0.8;
    animation: floatGlow 8s ease-in-out infinite;

    &--one {
      top: -44px;
      right: 10%;
      width: 220px;
      height: 220px;
      background: radial-gradient(circle, rgba(125, 211, 252, 0.46), transparent 68%);
    }

    &--two {
      right: -40px;
      bottom: -80px;
      width: 280px;
      height: 280px;
      background: radial-gradient(circle, rgba(45, 212, 191, 0.22), transparent 70%);
      animation-delay: -2.5s;
    }
  }

  &__content,
  &__actions {
    position: relative;
    z-index: 1;
  }

  &__content {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }

  &__copy {
    max-width: 700px;

    h2 {
      margin: 8px 0 0;
      font-size: 34px;
      line-height: 1.1;
      letter-spacing: 0.02em;
    }

    p {
      margin: 12px 0 0;
      line-height: 1.75;
      color: rgba(226, 232, 240, 0.84);
    }
  }

  &__eyebrow {
    display: inline-flex;
    padding: 6px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    color: #bae6fd;
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(120px, 1fr));
    gap: 12px;
    min-width: 300px;
  }

  &__actions {
    display: flex;
    gap: 12px;
  }
}

.stat-chip {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);

  span {
    color: rgba(226, 232, 240, 0.72);
    font-size: 12px;
  }

  strong {
    font-size: 18px;
    color: #f8fafc;
  }

  &.is-live strong {
    color: #a7f3d0;
  }
}

.mode-alert {
  border-radius: 18px;
}

.workspace {
  display: grid;
  grid-template-columns: 430px minmax(0, 1fr);
  gap: 18px;
  align-items: stretch;
}

.detail-stage {
  display: grid;
  min-height: 100%;
}

.panel {
  border: 0;
  border-radius: 28px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(12px);

  :deep(.el-card__header) {
    padding: 18px 20px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  }

  :deep(.el-card__body) {
    padding: 18px 20px 20px;
  }

  &--tree {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    min-height: var(--workspace-panel-height);
  }

  &--detail {
    min-height: var(--workspace-panel-height);

    :deep(.el-card__body) {
      height: 100%;
    }
  }
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;

  strong {
    display: block;
    color: #0f172a;
    font-size: 17px;
  }

  p {
    margin: 5px 0 0;
    color: #64748b;
    line-height: 1.6;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
}

.tree-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
  padding: 12px 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(236, 254, 255, 0.9));
  color: #475569;

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__right strong {
    color: #0f172a;
  }
}

.tree-scroll {
  height: calc(var(--workspace-panel-height) - 118px);
  min-height: 0;
}

.tree-shell {
  padding-right: 4px;
}

.detail-card {
  display: grid;
  grid-template-rows: auto auto auto auto 1fr;
  gap: 18px;
  min-height: 100%;

  &__hero {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 18px;
    align-items: center;
    padding: 20px;
    border-radius: 24px;
    background:
      radial-gradient(circle at right top, rgba(125, 211, 252, 0.28), transparent 34%),
      linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.94));
    color: #e2e8f0;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.12);
    font-size: 28px;
    color: #7dd3fc;
  }

  &__headline {
    display: flex;
    align-items: center;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 26px;
      color: #f8fafc;
    }
  }

  &__copy p {
    margin: 8px 0 0;
    color: rgba(226, 232, 240, 0.76);
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 14px;

    span {
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      font-size: 12px;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-cell {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.9));

  &__label {
    color: #94a3b8;
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  &__value {
    color: #0f172a;
    line-height: 1.7;
    word-break: break-all;
  }
}

.detail-flags {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.flag-item {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(241, 245, 249, 0.9);
  color: #64748b;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;

  strong {
    color: #0f172a;
  }

  &.active {
    transform: translateY(-2px);
    background: linear-gradient(135deg, rgba(224, 242, 254, 0.96), rgba(209, 250, 229, 0.94));
    box-shadow: 0 12px 24px rgba(14, 165, 233, 0.08);
  }
}

.meta-spotlight {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  &__item {
    display: grid;
    gap: 8px;
    padding: 16px 18px;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.94));
    box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.12);

    span {
      color: #94a3b8;
      font-size: 12px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    strong {
      color: #f8fafc;
      line-height: 1.65;
      word-break: break-all;
    }
  }
}

.guide-panel {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
  min-height: 0;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.9));

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    strong {
      color: #0f172a;
      font-size: 16px;
    }

    span {
      color: #94a3b8;
      font-size: 12px;
    }
  }
}

.guide-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  min-height: 0;
}

.guide-card {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(241, 245, 249, 0.86);

  &__label {
    color: #0369a1;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  p {
    margin: 0;
    color: #334155;
    line-height: 1.75;
  }
}

.empty-state {
  display: grid;
  place-items: center;
  gap: 10px;
  min-height: 100%;
  padding: 24px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.9));
  color: #64748b;
  text-align: center;

  .el-icon {
    font-size: 36px;
    color: #0284c7;
  }

  strong {
    color: #0f172a;
    font-size: 18px;
  }

  p {
    max-width: 420px;
    line-height: 1.7;
  }
}

@keyframes floatGlow {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(0, 12px, 0) scale(1.04);
  }
}

@media (max-width: 1380px) {
  .workspace {
    grid-template-columns: 390px minmax(0, 1fr);
  }

  .detail-grid,
  .detail-flags,
  .meta-spotlight {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .guide-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .tree-scroll {
    height: 520px;
  }

  .detail-stage {
    grid-template-rows: auto;
  }
}

@media (max-width: 768px) {
  .route-page {
    padding: 14px;
  }

  .hero {
    padding: 20px;

    &__content,
    &__actions {
      flex-direction: column;
      align-items: flex-start;
    }

    &__stats {
      width: 100%;
      min-width: 0;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .panel-header,
  .tree-toolbar,
  .detail-card__hero,
  .guide-panel__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-grid,
  .detail-flags,
  .meta-spotlight,
  .guide-grid,
  .hero__stats {
    grid-template-columns: 1fr;
  }

  .detail-card__hero {
    grid-template-columns: 1fr;
  }
}
</style>
