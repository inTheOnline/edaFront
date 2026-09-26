<template>
  <el-dialog
    v-model="visible"
    title="PDF 盖章"
    fullscreen
    :close-on-click-modal="false"
    :before-close="close"
    class="seal-dialog"
  >
    <div class="seal-tool" v-loading="busy">
      <header class="toolbar">
        <el-button :icon="Upload" @click="input?.click()">{{ file ? "重新导入 PDF" : "导入 PDF" }}</el-button>
        <input ref="input" type="file" accept=".pdf,application/pdf" hidden @change="importFile" />
        <span class="file-name" :title="file?.name">{{ file?.name || "导入 PDF → 选择公章或签名 → 拖拽位置 → 下载" }}</span>
        <el-button type="primary" :icon="Download" :disabled="!file || !hasMarks || !!groupError || previewBusy" @click="download"
          >下载盖章 PDF</el-button
        >
      </header>
      <div class="workspace">
        <aside class="settings">
          <h3>选择公章或签名</h3>
          <el-radio-group v-model="category" class="category">
            <el-radio-button value="seal">公章</el-radio-button>
            <el-radio-button value="signature">签名</el-radio-button>
          </el-radio-group>
          <div v-if="libraryError" class="error">{{ libraryError }} <el-button link @click="loadSeals">重试</el-button></div>
          <div class="seal-library">
            <button
              v-for="seal in seals.filter((s) => s.type === category)"
              :key="seal.id"
              class="seal-choice"
              :class="{ active: chosen === seal.id }"
              :aria-pressed="chosen === seal.id"
              @click="chosen = seal.id"
            >
              <img :src="seal.image" :alt="seal.name" draggable="false" /><span>{{ seal.name }}</span>
            </button>
          </div>
          <p class="hint">公章：圆章直径 4cm，椭圆长轴 4cm。签名默认宽 2cm，可等比例调整。</p>
          <el-button type="primary" plain :disabled="!file || !chosenSeal || previewBusy" @click="addMark"
            >添加到当前页</el-button
          >

          <template v-if="activeMark && activeSeal">
            <h3>当前选中：{{ activeSeal.name }}</h3>
            <el-form label-position="top">
              <el-form-item v-if="activeSeal.type === 'signature'" label="签名宽度（cm）">
                <el-input-number v-model="activeMark.widthCm" :min="0.5" :max="20" :step="0.1" :precision="2" @change="fitMark" />
              </el-form-item>
              <el-form-item label="距页面左侧（cm）"
                ><el-input-number
                  :model-value="activeMark.x / CM"
                  :min="0"
                  :max="Math.max(0, (pageSize.width - activeDimensions.width) / CM)"
                  :step="0.1"
                  :precision="2"
                  @change="(v) => setPosition('x', v)"
              /></el-form-item>
              <el-form-item label="距页面顶部（cm）"
                ><el-input-number
                  :model-value="activeMark.y / CM"
                  :min="0"
                  :max="Math.max(0, (pageSize.height - activeDimensions.height) / CM)"
                  :step="0.1"
                  :precision="2"
                  @change="(v) => setPosition('y', v)"
              /></el-form-item>
            </el-form>
            <el-button type="danger" plain @click="removeMark(activeMark.id)">删除此印迹</el-button>
          </template>

          <h3>骑缝章 <small>最多两组</small></h3>
          <p class="hint">每组填写参与页码，各页切片拼成一个完整章。可在预览边缘上下拖动。</p>
          <el-button
            :disabled="!file || seams.length >= 2 || category !== 'seal' || !chosenSeal || pages.length < 2"
            @click="addSeam"
            >添加一组骑缝章</el-button
          >
          <div v-for="(seam, index) in seams" :key="seam.id" class="seam-editor">
            <div class="group-heading">
              <strong>第 {{ index + 1 }} 组</strong
              ><el-button type="danger" link @click="seams = seams.filter((s) => s.id !== seam.id)">删除</el-button>
            </div>
            <el-form label-position="top">
              <el-form-item label="使用公章"
                ><el-select v-model="seam.sealId"
                  ><el-option
                    v-for="seal in seals.filter((s) => s.type === 'seal')"
                    :key="seal.id"
                    :label="seal.name"
                    :value="seal.id" /></el-select
              ></el-form-item>
              <el-form-item label="参与页码" :error="seam.error"
                ><el-input v-model="seam.text" placeholder="例如 1-5,8,10" @input="validateGroup(seam)"
              /></el-form-item>
              <el-form-item label="盖章边缘"
                ><el-radio-group v-model="seam.edge"
                  ><el-radio value="left">左侧</el-radio><el-radio value="right">右侧</el-radio></el-radio-group
                ></el-form-item
              >
              <el-form-item label="距顶部（cm）"
                ><el-input-number
                  :model-value="seam.y / CM"
                  :min="0"
                  :max="seamMax(seam) / CM"
                  :step="0.1"
                  :precision="2"
                  @change="(v) => (seam.y = (v ?? 0) * CM)"
              /></el-form-item>
            </el-form>
          </div>
          <h3 v-if="marks.length">已放置印迹（{{ marks.length }}）</h3>
          <div v-for="mark in marks" :key="mark.id" class="mark-row">
            <el-button link :type="selected === mark.id ? 'primary' : 'default'" @click="selectMark(mark)"
              >第 {{ mark.page }} 页 · {{ sealById(mark.sealId)?.name }}</el-button
            >
            <el-button link type="danger" @click="removeMark(mark.id)">删除</el-button>
          </div>
        </aside>

        <main class="preview-area">
          <div v-if="file" class="page-controls">
            <el-button :disabled="pageNumber <= 1 || previewBusy" @click="pageNumber--">上一页</el-button>
            <span>第</span
            ><el-input-number
              v-model="pageNumber"
              :min="1"
              :max="pages.length"
              :controls="false"
              :disabled="previewBusy"
              class="page-input"
            /><span>/ {{ pages.length }} 页</span>
            <el-button :disabled="pageNumber >= pages.length || previewBusy" @click="pageNumber++">下一页</el-button>
            <el-select v-model="zoom" aria-label="预览缩放" class="zoom-select"
              ><el-option v-for="n in [60, 80, 100, 125, 150, 200]" :key="n" :label="n === 100 ? '适应宽度' : `${n}%`" :value="n"
            /></el-select>
          </div>
          <div ref="viewport" class="page-scroll" v-loading="previewBusy">
            <el-empty v-if="!file" description="先导入需要盖章的 PDF 文件（最大 30MB）" />
            <div v-else-if="previewError" class="preview-error">
              <p>{{ previewError }}</p>
              <el-button @click="renderPage">重新加载页面</el-button>
            </div>
            <div
              v-else-if="previewUrl"
              class="paper"
              :style="{ width: `${pageSize.width * scale}px`, height: `${pageSize.height * scale}px` }"
            >
              <img class="page-image" :src="previewUrl" :alt="`PDF 第 ${pageNumber} 页`" draggable="false" />
              <button
                v-for="mark in pageMarks"
                :key="mark.id"
                class="placed-mark"
                :class="{ selected: selected === mark.id }"
                :style="markStyle(mark)"
                :aria-label="`${sealById(mark.sealId)?.name}，可拖动或使用方向键移动`"
                @pointerdown="startDrag($event, mark, false)"
                @pointermove="dragMove"
                @pointerup="endDrag"
                @pointercancel="endDrag"
                @keydown="nudge($event, mark, false)"
                @focus="selected = mark.id"
              >
                <img :src="sealById(mark.sealId)?.image" alt="" draggable="false" />
              </button>
              <button
                v-for="part in seamParts"
                :key="`seam-${part.seam.id}`"
                class="placed-mark seam-mark"
                :style="part.style"
                :aria-label="`第 ${part.index + 1} 组骑缝章，上下拖动调整位置`"
                @pointerdown="startDrag($event, part.seam, true)"
                @pointermove="dragMove"
                @pointerup="endDrag"
                @pointercancel="endDrag"
                @keydown="nudge($event, part.seam, true)"
              >
                <img :src="sealById(part.seam.sealId)?.image" alt="" draggable="false" :style="part.imageStyle" />
              </button>
            </div>
          </div>
          <footer class="preview-hint">
            拖动印迹调整位置，也可选中后使用方向键微调。预览缩放不影响导出尺寸，打印请选择“实际大小 / 100%”。
          </footer>
        </main>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Upload, Download } from "@element-plus/icons-vue";
import { getSeals, getSealPages, getSealPreview, exportSealedPdf, sealBlob } from "@/api/modules/seal";
import type { Seal, SealPage, SealMark, SealSeam } from "@/api/modules/seal";
import { CM, clamp, parsePages, sealSize } from "./layout";

type Group = SealSeam & { text: string; error: string };
const visible = ref(false),
  busy = ref(false),
  previewBusy = ref(false);
const input = ref<HTMLInputElement>(),
  viewport = ref<HTMLElement>();
const file = ref<File>(),
  seals = ref<Seal[]>([]),
  pages = ref<SealPage[]>([]);
const marks = ref<SealMark[]>([]),
  seams = ref<Group[]>([]);
const category = ref<"seal" | "signature">("seal"),
  chosen = ref("");
const selected = ref<number>(),
  pageNumber = ref(1),
  zoom = ref(100),
  viewportWidth = ref(800);
const previewUrl = ref(""),
  previewError = ref(""),
  libraryError = ref("");
let serial = 0,
  request = 0;
let observer: ResizeObserver | undefined;
const pageSize = computed(() => pages.value[pageNumber.value - 1] || { width: 595, height: 842 });
const scale = computed(() => (Math.min(1.5, Math.max(200, viewportWidth.value - 48) / pageSize.value.width) * zoom.value) / 100);
const sealById = (id: string) => seals.value.find((s) => s.id === id);
const chosenSeal = computed(() => sealById(chosen.value));
const activeMark = computed(() => marks.value.find((m) => m.id === selected.value && m.page === pageNumber.value));
const activeSeal = computed(() => activeMark.value && sealById(activeMark.value.sealId));
const activeDimensions = computed(() =>
  activeSeal.value ? sealSize(activeSeal.value, activeMark.value?.widthCm) : { width: 0, height: 0 },
);
const pageMarks = computed(() => marks.value.filter((m) => m.page === pageNumber.value));
const groupError = computed(() => seams.value.find((s) => s.error)?.error);
const hasMarks = computed(() => marks.value.length + seams.value.length > 0);
const message = (error: unknown) => (error instanceof Error ? error.message : "处理失败，请重试");

async function loadSeals() {
  libraryError.value = "";
  try {
    seals.value = (await getSeals()).data;
    chosen.value = seals.value.find((s) => s.type === category.value)?.id || "";
  } catch (error) {
    libraryError.value = message(error);
  }
}
async function open() {
  visible.value = true;
  await nextTick();
  observer?.disconnect();
  observer = new ResizeObserver((entries) => {
    viewportWidth.value = entries[0].contentRect.width;
  });
  if (viewport.value) observer.observe(viewport.value);
  if (!seals.value.length) await loadSeals();
}
watch(category, (type) => {
  chosen.value = seals.value.find((s) => s.type === type)?.id || "";
});

function formData() {
  const data = new FormData();
  if (file.value) data.append("file", file.value);
  return data;
}
async function importFile(event: Event) {
  const field = event.target as HTMLInputElement;
  const next = field.files?.[0];
  field.value = "";
  if (!next) return;
  if (!/\.pdf$/i.test(next.name) || next.size > 30 * 1024 * 1024) {
    ElMessage.error("请选择不超过 30MB 的 PDF 文件");
    return;
  }
  if (hasMarks.value) {
    try {
      await ElMessageBox.confirm("重新导入将清除当前盖章位置，是否继续？", "重新导入");
    } catch {
      return;
    }
  }
  busy.value = true;
  try {
    const data = new FormData();
    data.append("file", next);
    const result = await getSealPages(data);
    request++;
    file.value = next;
    pages.value = result.data;
    marks.value = [];
    seams.value = [];
    selected.value = undefined;
    const previous = pageNumber.value;
    pageNumber.value = 1;
    if (previous === 1) await renderPage();
  } catch (error) {
    ElMessage.error(message(error));
  } finally {
    busy.value = false;
  }
}
async function renderPage() {
  if (!file.value) return;
  const version = ++request;
  previewBusy.value = true;
  previewError.value = "";
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
  try {
    const data = formData();
    data.append("page", String(pageNumber.value));
    const blob = await sealBlob(await getSealPreview(data));
    if (version === request) previewUrl.value = URL.createObjectURL(blob);
  } catch (error) {
    if (version === request) previewError.value = message(error);
  } finally {
    if (version === request) previewBusy.value = false;
  }
}
watch(pageNumber, () => {
  selected.value = undefined;
  renderPage();
});

function addMark() {
  const seal = chosenSeal.value;
  if (!seal) return;
  const { width, height } = sealSize(seal);
  if (width > pageSize.value.width || height > pageSize.value.height) {
    ElMessage.error("当前页面过小，无法放置此印迹");
    return;
  }
  const mark = {
    id: ++serial,
    sealId: seal.id,
    page: pageNumber.value,
    x: (pageSize.value.width - width) / 2,
    y: (pageSize.value.height - height) / 2,
    widthCm: seal.widthCm,
  };
  marks.value.push(mark);
  selected.value = mark.id;
}
function fitMark() {
  const mark = activeMark.value,
    seal = activeSeal.value;
  if (!mark || !seal) return;
  mark.widthCm = Math.max(
    0.5,
    Math.min(mark.widthCm || 2, 20, pageSize.value.width / CM, pageSize.value.height / CM / seal.ratio),
  );
  const size = sealSize(seal, mark.widthCm);
  mark.x = clamp(mark.x, pageSize.value.width - size.width);
  mark.y = clamp(mark.y, pageSize.value.height - size.height);
}
function setPosition(key: "x" | "y", value: number | undefined) {
  if (activeMark.value) {
    activeMark.value[key] = (value ?? 0) * CM;
    fitMark();
  }
}
function removeMark(id: number) {
  marks.value = marks.value.filter((m) => m.id !== id);
}
async function selectMark(mark: SealMark) {
  pageNumber.value = mark.page;
  await nextTick();
  selected.value = mark.id;
}
function markStyle(mark: SealMark) {
  const seal = sealById(mark.sealId)!;
  const size = sealSize(seal, mark.widthCm);
  return {
    left: `${mark.x * scale.value}px`,
    top: `${mark.y * scale.value}px`,
    width: `${size.width * scale.value}px`,
    height: `${size.height * scale.value}px`,
  };
}
function validateGroup(group: Group) {
  try {
    group.pages = parsePages(group.text, pages.value.length);
    const size = sealSize(sealById(group.sealId)!);
    if (
      group.pages.some(
        (p) => pages.value[p - 1].height < size.height || pages.value[p - 1].width < size.width / group.pages.length,
      )
    )
      throw new Error("所选页面过小，无法放置此骑缝章");
    group.error = "";
    group.y = clamp(group.y, seamMax(group));
  } catch (error) {
    group.pages = [];
    group.error = message(error);
  }
}
function addSeam() {
  const group: Group = {
    id: ++serial,
    sealId: chosen.value,
    pages: [],
    text: "",
    edge: "right",
    y: 5 * CM,
    error: "请输入本组参与页码",
  };
  seams.value.push(group);
}
function seamMax(group: Group) {
  const seal = sealById(group.sealId);
  if (!seal || !group.pages.length) return 100 * CM;
  return Math.max(0, Math.min(...group.pages.map((p) => pages.value[p - 1].height)) - sealSize(seal).height);
}
watch(
  () => seams.value.map((s) => s.sealId).join(","),
  () => seams.value.forEach(validateGroup),
);
const seamParts = computed(() =>
  seams.value.flatMap((seam, index) => {
    const part = seam.pages.indexOf(pageNumber.value),
      seal = sealById(seam.sealId);
    if (part < 0 || !seal || seam.error) return [];
    const size = sealSize(seal),
      slice = size.width / seam.pages.length;
    return [
      {
        seam,
        index,
        style: {
          left: `${(seam.edge === "right" ? pageSize.value.width - slice : 0) * scale.value}px`,
          top: `${clamp(seam.y, pageSize.value.height - size.height) * scale.value}px`,
          width: `${slice * scale.value}px`,
          height: `${size.height * scale.value}px`,
        },
        imageStyle: {
          width: `${size.width * scale.value}px`,
          height: `${size.height * scale.value}px`,
          left: `${-part * slice * scale.value}px`,
        },
      },
    ];
  }),
);

let drag: { target: SealMark | Group; seam: boolean; x: number; y: number; startX: number; startY: number } | undefined;
function startDrag(event: PointerEvent, target: SealMark | Group, seam: boolean) {
  if (event.button !== 0 || previewBusy.value) return;
  event.preventDefault();
  if (!seam) selected.value = target.id;
  (event.currentTarget as HTMLElement).focus({ preventScroll: true });
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  drag = { target, seam, x: "x" in target ? target.x : 0, y: target.y, startX: event.clientX, startY: event.clientY };
}
function move(target: SealMark | Group, seam: boolean, x: number, y: number) {
  const size = sealSize(sealById(target.sealId)!, "widthCm" in target ? target.widthCm : 4);
  if (seam) target.y = clamp(y, seamMax(target as Group));
  else {
    (target as SealMark).x = clamp(x, pageSize.value.width - size.width);
    target.y = clamp(y, pageSize.value.height - size.height);
  }
}
function dragMove(event: PointerEvent) {
  if (drag)
    move(
      drag.target,
      drag.seam,
      drag.x + (event.clientX - drag.startX) / scale.value,
      drag.y + (event.clientY - drag.startY) / scale.value,
    );
}
function endDrag(event: PointerEvent) {
  drag = undefined;
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
}
function nudge(event: KeyboardEvent, target: SealMark | Group, seam: boolean) {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
  event.preventDefault();
  const step = (event.shiftKey ? 0.5 : 0.1) * CM;
  move(
    target,
    seam,
    ("x" in target ? target.x : 0) + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0),
    target.y + (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0),
  );
}
async function download() {
  seams.value.forEach(validateGroup);
  if (groupError.value) {
    ElMessage.error(groupError.value);
    return;
  }
  busy.value = true;
  try {
    const data = formData();
    data.append(
      "plan",
      JSON.stringify({
        marks: marks.value.map(({ sealId, page, x, y, widthCm }) => ({ sealId, page, x, y, widthCm })),
        seams: seams.value.map(({ sealId, pages, edge, y }) => ({ sealId, pages, edge, y })),
      }),
    );
    const blob = await sealBlob(await exportSealedPdf(data));
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = `${file.value!.name.replace(/\.pdf$/i, "")}_已盖章.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    ElMessage.success("已生成盖章 PDF");
  } catch (error) {
    ElMessage.error(message(error));
  } finally {
    busy.value = false;
  }
}
function cleanup() {
  request++;
  observer?.disconnect();
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
  drag = undefined;
}
async function close(done: () => void) {
  if (busy.value) {
    ElMessage.info("正在处理文件，请稍候");
    return;
  }
  if (hasMarks.value) {
    try {
      await ElMessageBox.confirm("关闭后将清除当前盖章位置，请确认已下载需要的文件。", "关闭盖章工具");
    } catch {
      return;
    }
  }
  cleanup();
  file.value = undefined;
  pages.value = [];
  marks.value = [];
  seams.value = [];
  previewBusy.value = false;
  done();
}
onBeforeUnmount(cleanup);
defineExpose({ open });
</script>

<style scoped lang="scss">
.seal-tool {
  display: flex;
  height: calc(100dvh - 100px);
  min-height: 400px;
  flex-direction: column;
  color: var(--el-text-color-primary);
}
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 0 0 16px;
  border-bottom: 1px solid var(--el-border-color);
}
.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.workspace {
  display: flex;
  flex: 1;
  min-height: 0;
}
.settings {
  width: 290px;
  flex-shrink: 0;
  padding: 0 18px 20px 0;
  overflow-y: auto;
  border-right: 1px solid var(--el-border-color);
}
h3 {
  margin: 20px 0 12px;
  font-size: 15px;
}
small,
.hint {
  color: var(--el-text-color-secondary);
  font-weight: normal;
}
.hint {
  font-size: 13px;
  line-height: 1.6;
}
.seal-library {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 12px;
}
.seal-choice {
  display: flex;
  min-height: 102px;
  padding: 8px;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  cursor: pointer;
}
.seal-choice img {
  width: 76px;
  height: 65px;
  object-fit: contain;
  background: white;
}
.seal-choice.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
button:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
.seam-editor {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color);
}
.group-heading,
.mark-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.settings :deep(.el-form-item) {
  margin-bottom: 18px;
}
.settings :deep(.el-input-number) {
  width: 100%;
}
.preview-area {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}
.page-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  align-items: center;
  padding: 12px;
}
.page-input {
  width: 65px;
}
.zoom-select {
  width: 120px;
}
.page-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 24px;
  background: var(--el-fill-color);
}
.paper {
  position: relative;
  margin: 0 auto;
  flex-shrink: 0;
  background: white;
  box-shadow: var(--el-box-shadow-light);
}
.page-image {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.placed-mark {
  position: absolute;
  display: block;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: grab;
  touch-action: none;
}
.placed-mark:active {
  cursor: grabbing;
}
.placed-mark img {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
}
.placed-mark.selected {
  outline: 1px dashed var(--el-color-primary);
  outline-offset: 2px;
}
.seam-mark {
  overflow: hidden;
  outline: 1px dashed var(--el-color-primary);
}
.seam-mark img {
  position: absolute;
  top: 0;
  max-width: none;
}
.preview-hint {
  padding: 12px 16px 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.error,
.preview-error {
  color: var(--el-color-danger);
}
@media (max-width: 760px) {
  .workspace {
    flex-direction: column;
    overflow-y: auto;
  }
  .settings {
    width: auto;
    max-height: 280px;
    flex-shrink: 0;
    padding-right: 0;
    border-right: 0;
  }
  .preview-area {
    min-height: 500px;
  }
  .seal-library {
    grid-template-columns: repeat(3, 1fr);
  }
  .toolbar {
    flex-wrap: wrap;
  }
  .file-name {
    flex-basis: 50%;
  }
}
</style>
