<template>
  <Draggable
    class="tree-list"
    :class="{ 'tree-list--root': level === 0 }"
    :list="nodes"
    item-key="nodeKey"
    tag="div"
    :group="{ name: 'route-tree', pull: true, put: true }"
    handle=".tree-row__handle"
    ghost-class="tree-drop-line"
    chosen-class="tree-row--chosen"
    drag-class="tree-row--dragging"
    :animation="180"
    @start="handleSortStart"
    @end="handleSortEnd"
    @move="handleMove"
  >
    <template #item="{ element }">
      <div class="tree-entry" :data-node-key="element.nodeKey">
        <div
          class="tree-row"
          :class="{
            'is-catalog': element.routeType === 'catalog',
            'is-active': selectedKey === element.nodeKey,
            'is-dragging': draggedKey === element.nodeKey,
            'is-child-target': childHoverKey === element.nodeKey
          }"
          @click="emit('select-node', element.nodeKey)"
        >
          <div class="tree-row__inner" :style="{ paddingLeft: `${level * 18 + 12}px` }">
            <button
              v-if="element.routeType === 'catalog'"
              type="button"
              class="tree-row__toggle"
              @click.stop="emit('toggle-node', element.nodeKey)"
            >
              <el-icon>
                <component :is="isExpanded(element) ? ArrowDown : ArrowRight" />
              </el-icon>
            </button>
            <span v-else class="tree-row__toggle tree-row__toggle--ghost"></span>

            <button type="button" class="tree-row__handle" title="拖拽排序" @click.stop>
              <el-icon><Grid /></el-icon>
            </button>

            <div
              class="tree-row__body"
              @dragenter.stop.prevent="activateChildTarget(element)"
              @dragover.stop.prevent="activateChildTarget(element)"
              @drop.stop.prevent="dropAsChild(element)"
            >
              <div class="tree-row__icon">
                <el-icon>
                  <component :is="element.meta.icon || 'Grid'" />
                </el-icon>
              </div>

              <div class="tree-row__copy">
                <div class="tree-row__headline">
                  <strong>{{ element.meta.title || element.name || element.path }}</strong>
                  <el-tag
                    size="small"
                    effect="plain"
                    :type="element.routeType === 'catalog' ? 'warning' : 'success'"
                    round
                  >
                    {{ element.routeType === "catalog" ? "目录" : "页面" }}
                  </el-tag>
                </div>
                <div class="tree-row__subline">
                  <span>{{ element.path }}</span>
                  <small v-if="element.meta.roles">{{ element.meta.roles }}</small>
                </div>
              </div>
            </div>

            <div class="tree-row__meta">
              <span class="tree-row__order">#{{ element.sort ?? 0 }}</span>
            </div>
          </div>

          <transition name="hint-fade">
            <div v-if="childHoverKey === element.nodeKey" class="tree-row__hint">
              将成为 {{ element.meta.title || element.path }} 的子节点
            </div>
          </transition>
        </div>

        <RouteTopologyBranch
          v-if="element.routeType === 'catalog' && isExpanded(element)"
          :nodes="element.children ?? []"
          :level="level + 1"
          :parent-key="element.nodeKey"
          :expanded-keys="expandedKeys"
          :dragged-key="draggedKey"
          :child-hover-key="childHoverKey"
          :selected-key="selectedKey"
          @toggle-node="emit('toggle-node', $event)"
          @drag-start="emit('drag-start', $event)"
          @sort-end="emit('sort-end', $event)"
          @child-hover="emit('child-hover', $event)"
          @drop-as-child="emit('drop-as-child', $event)"
          @select-node="emit('select-node', $event)"
        />
      </div>
    </template>
  </Draggable>
</template>

<script setup lang="ts">
import Draggable from "vuedraggable";
import { ArrowDown, ArrowRight, Grid } from "@element-plus/icons-vue";
import { RouteManage } from "@/api/interface/route";

defineOptions({ name: "RouteTopologyBranch" });

interface RouteTreeViewNode extends RouteManage.RouteTreeNode {
  nodeKey: string;
  routeType: RouteManage.RouteType;
  children?: RouteTreeViewNode[];
}

const props = withDefaults(
  defineProps<{
    nodes: RouteTreeViewNode[];
    level?: number;
    parentKey?: string | null;
    expandedKeys: string[];
    draggedKey: string;
    childHoverKey: string;
    selectedKey: string;
  }>(),
  {
    level: 0,
    parentKey: null
  }
);

const emit = defineEmits<{
  "toggle-node": [nodeKey: string];
  "drag-start": [{ nodeKey: string; parentKey: string | null }];
  "sort-end": [{ nodeKey: string }];
  "child-hover": [nodeKey: string];
  "drop-as-child": [parentKey: string];
  "select-node": [nodeKey: string];
}>();

const isExpanded = (node: RouteTreeViewNode) => props.expandedKeys.includes(node.nodeKey);

const handleSortStart = (event: { item: HTMLElement }) => {
  emit("drag-start", {
    nodeKey: event.item.dataset.nodeKey || "",
    parentKey: props.parentKey ?? null
  });
};

const handleSortEnd = (event: { item: HTMLElement }) => {
  emit("sort-end", { nodeKey: event.item.dataset.nodeKey || "" });
};

const handleMove = () => {
  emit("child-hover", "");
  return true;
};

const activateChildTarget = (node: RouteTreeViewNode) => {
  if (!props.draggedKey || props.draggedKey === node.nodeKey || node.routeType !== "catalog") return;
  emit("child-hover", node.nodeKey);
};

const dropAsChild = (node: RouteTreeViewNode) => {
  if (!props.draggedKey || props.draggedKey === node.nodeKey || node.routeType !== "catalog") return;
  emit("drop-as-child", node.nodeKey);
};
</script>

<style scoped lang="scss">
.tree-list {
  display: grid;
  gap: 6px;
}

.tree-entry {
  display: grid;
  gap: 2px;
}

.tree-row {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.84);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    transform: translateX(2px);
    border-color: rgba(59, 130, 246, 0.18);
    background: rgba(248, 250, 252, 0.96);
  }

  &.is-active {
    border-color: rgba(14, 116, 144, 0.28);
    background:
      linear-gradient(135deg, rgba(12, 74, 110, 0.08), rgba(14, 165, 233, 0.12)),
      rgba(255, 255, 255, 0.96);
    box-shadow: 0 14px 30px rgba(14, 116, 144, 0.12);

    .tree-row__icon {
      background: linear-gradient(135deg, rgba(2, 132, 199, 0.14), rgba(59, 130, 246, 0.22));
      color: #0369a1;
    }
  }

  &.is-child-target {
    border-color: rgba(16, 185, 129, 0.3);
    background:
      linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(45, 212, 191, 0.06)),
      rgba(255, 255, 255, 0.98);
    box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.08);
  }

  &.is-dragging {
    opacity: 0.35;
  }

  &__inner {
    display: grid;
    grid-template-columns: 28px 30px minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    min-height: 60px;
    padding: 0 14px 0 8px;
  }

  &__toggle,
  &__handle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 10px;
    color: #64748b;
    background: transparent;
  }

  &__toggle {
    cursor: pointer;

    &--ghost {
      visibility: hidden;
    }
  }

  &__handle {
    cursor: grab;

    &:hover {
      background: rgba(148, 163, 184, 0.16);
    }
  }

  &__body {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 10px 0;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 12px;
    background: rgba(59, 130, 246, 0.08);
    color: #2563eb;
    flex: none;
    transition:
      background-color 0.18s ease,
      color 0.18s ease;
  }

  &__copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  &__headline {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;

    strong {
      overflow: hidden;
      color: #0f172a;
      font-size: 14px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__subline {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    span,
    small {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: #64748b;
      font-size: 13px;
    }

    small {
      color: #94a3b8;
      font-size: 12px;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  &__order {
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.05);
    color: #475569;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  &__hint {
    margin: 0 14px 10px 88px;
    padding: 7px 10px;
    border-radius: 12px;
    background: rgba(16, 185, 129, 0.12);
    color: #047857;
    font-size: 12px;
    line-height: 1.45;
  }
}

.tree-list :deep(.tree-drop-line) {
  position: relative;
  height: 10px !important;
  min-height: 10px !important;
  margin: 2px 0;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(2, 132, 199, 0.2), rgba(59, 130, 246, 0.56), rgba(2, 132, 199, 0.2)) !important;
  box-shadow: 0 0 0 1px rgba(2, 132, 199, 0.12);

  > * {
    display: none !important;
  }
}

.tree-list :deep(.tree-row--dragging) {
  opacity: 0.18;
}

.tree-list :deep(.tree-row--chosen) {
  background: rgba(241, 245, 249, 0.96);
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: all 0.18s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 768px) {
  .tree-row {
    &__inner {
      grid-template-columns: 28px 30px minmax(0, 1fr);
      padding-right: 10px;
    }

    &__meta {
      display: none;
    }

    &__headline,
    &__subline {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    &__hint {
      margin-left: 86px;
    }
  }
}
</style>
