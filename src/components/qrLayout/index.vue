<template>
  <div class="qr-layout" tabindex="0" @keydown="handleKeydown" @keyup="handleKeyup">
    <header class="qr-layout__toolbar">
      <div class="toolbar-group">
        <el-button type="primary" @click="resetTemplate"><el-icon><DocumentAdd /></el-icon>新建</el-button>
        <el-select v-model="exampleName" class="example-select" @change="useExample">
          <el-option v-for="item in templateExamples" :key="item.name" :label="item.name" :value="item.name" />
        </el-select>
        <el-button @click="paperVisible = true"><el-icon><Setting /></el-icon>纸张</el-button>
        <el-button @click="triggerImport"><el-icon><Upload /></el-icon>导入</el-button>
        <el-button @click="exportTemplate"><el-icon><Download /></el-icon>导出</el-button>
        <input ref="templateInputRef" class="hidden-input" type="file" accept=".json,application/json" @change="importTemplate" />
        <input ref="imageInputRef" class="hidden-input" type="file" accept="image/*" @change="addImageByFile" />
      </div>
      <div class="toolbar-group">
        <el-button @click="undo"><el-icon><RefreshLeft /></el-icon>撤销</el-button>
        <el-button @click="redo"><el-icon><RefreshRight /></el-icon>重做</el-button>
        <el-button :disabled="!selectedElement" @click="duplicateSelected"><el-icon><CopyDocument /></el-icon>复制</el-button>
        <el-button type="danger" plain :disabled="!selectedElement" @click="removeSelected"><el-icon><Delete /></el-icon>删除</el-button>
      </div>
      <div class="toolbar-group">
        <el-switch v-model="showGrid" active-text="网格" />
        <el-select v-model="gridSize" class="grid-select">
          <el-option label="0.1mm" :value="0.1" />
          <el-option label="0.5mm" :value="0.5" />
          <el-option label="1mm" :value="1" />
          <el-option label="2mm" :value="2" />
        </el-select>
        <el-slider v-model="zoomPercent" class="zoom-slider" :min="10" :max="800" :step="10" />
        <span class="zoom-text">{{ zoomPercent }}%</span>
        <el-button type="success" @click="openPrintDialog(false)"><el-icon><Printer /></el-icon>打印</el-button>
        <el-button @click="openPrintDialog(true)">测试</el-button>
        <el-button @click="showTsplDialog">TSPL</el-button>
      </div>
    </header>

    <main class="qr-layout__body">
      <aside class="qr-layout__left">
        <section class="panel">
          <div class="panel-title">元素</div>
          <div class="tool-grid">
            <el-button @click="addElement('text')"><el-icon><EditPen /></el-icon>文本</el-button>
            <el-button @click="addElement('qr')"><el-icon><Grid /></el-icon>二维码</el-button>
            <el-button @click="addElement('code128')"><el-icon><Tickets /></el-icon>Code128</el-button>
            <el-button @click="triggerImage"><el-icon><Picture /></el-icon>图片</el-button>
            <el-button @click="addElement('line')"><el-icon><Minus /></el-icon>线条</el-button>
            <el-button @click="addElement('rect')"><el-icon><Crop /></el-icon>矩形</el-button>
          </div>
        </section>
        <section class="panel">
          <div class="panel-title">模板库</div>
          <div class="template-list">
            <button v-for="item in templateExamples" :key="item.name" class="template-card" @click="useExample(item.name)">
              <strong>{{ item.name }}</strong>
              <span>{{ item.paper.width }} x {{ item.paper.height }}mm</span>
            </button>
          </div>
        </section>
      </aside>

      <section class="qr-layout__stage">
        <div class="stage-head">
          <span>{{ template.name }}</span>
          <span>滚轮缩放 10%-800%，Shift + 缩放保持比例</span>
          <span>{{ template.paper.width }}mm x {{ template.paper.height }}mm</span>
        </div>
        <div ref="stageScrollRef" class="stage-scroll" @wheel.prevent="handleWheelZoom" @mousedown="clearSelection">
          <div ref="canvasRef" class="label-canvas" :class="{ 'is-grid': showGrid }" :style="canvasStyle">
            <div
              v-for="item in sortedElements"
              v-show="item.visible"
              :id="item.id"
              :key="item.id"
              class="label-element"
              :class="{ 'is-selected': selectedId === item.id, 'is-locked': item.locked }"
              :style="elementStyle(item)"
              @mousedown.stop="selectElement(item.id)"
              @dblclick.stop="startTextEdit(item)"
            >
              <template v-if="item.type === 'text'">
                <textarea
                  v-if="editingId === item.id"
                  v-model="item.expression"
                  class="element-editor"
                  :style="textStyle(item)"
                  @blur="finishTextEdit"
                  @keydown.stop
                />
                <div v-else class="element-text" :style="textStyle(item)">{{ renderElement(item) }}</div>
              </template>
              <template v-else-if="item.type === 'qr'">
                <img class="element-image" :src="qrCache[item.id]" alt="二维码" />
                <div v-if="item.sourceText.visible" class="source-text" :style="sourceTextStyle(item)">{{ renderElement(item) }}</div>
              </template>
              <template v-else-if="item.type === 'code128'">
                <div class="barcode-box" v-html="code128Svg(renderElement(item))"></div>
                <div v-if="item.sourceText.visible" class="source-text" :style="sourceTextStyle(item)">{{ renderElement(item) }}</div>
              </template>
              <template v-else-if="item.type === 'image'">
                <img class="element-image" :class="`fit-${item.fit}`" :src="item.src" alt="图片" />
              </template>
              <template v-else-if="item.type === 'line'">
                <div class="element-line" :style="{ height: `${Math.max(item.strokeWidth * zoom, 1)}px` }"></div>
              </template>
              <template v-else>
                <div class="element-rect" :class="{ fill: item.fill }" :style="{ borderWidth: `${Math.max(item.strokeWidth * zoom, 1)}px` }"></div>
              </template>
            </div>
            <Moveable
              v-if="selectedTarget && selectedElement && !selectedElement.locked && editingId !== selectedId"
              :target="selectedTarget"
              :container="canvasRef"
              :draggable="true"
              :resizable="true"
              :rotatable="true"
              :snappable="showGrid"
              :snapThreshold="2"
              :elementGuidelines="moveableGuidelines"
              :bounds="moveableBounds"
              :keepRatio="keepRatio"
              :origin="false"
              :renderDirections="['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']"
              :throttleDrag="0"
              :throttleResize="0"
              :throttleRotate="90"
              @dragStart="onMoveableStart"
              @drag="onMoveableDrag"
              @resizeStart="onMoveableStart"
              @resize="onMoveableResize"
              @rotateStart="onMoveableStart"
              @rotate="onMoveableRotate"
              @dragEnd="onMoveableEnd"
              @resizeEnd="onMoveableEnd"
              @rotateEnd="onMoveableEnd"
            />
          </div>
        </div>
      </section>

      <aside class="qr-layout__right">
        <section class="panel">
          <div class="panel-title">对象树</div>
          <div class="layer-list">
            <div v-for="item in layerElements" :key="item.id" class="layer-row" :class="{ active: selectedId === item.id }" @click="selectElement(item.id)">
              <span>{{ item.name }}</span>
              <div class="layer-actions-inline">
                <el-button link @click.stop="item.visible = !item.visible">{{ item.visible ? "显示" : "隐藏" }}</el-button>
                <el-button link @click.stop="item.locked = !item.locked">{{ item.locked ? "锁定" : "解锁" }}</el-button>
                <el-button link type="danger" @click.stop="removeElement(item.id)">删除</el-button>
              </div>
            </div>
          </div>
          <div class="layer-actions">
            <el-button size="small" :disabled="!selectedElement" @click="moveLayer(1)">上移</el-button>
            <el-button size="small" :disabled="!selectedElement" @click="moveLayer(-1)">下移</el-button>
            <el-button size="small" :disabled="!selectedElement" @click="moveTop">置顶</el-button>
            <el-button size="small" :disabled="!selectedElement" @click="moveBottom">置底</el-button>
          </div>
        </section>

        <section class="panel">
          <div class="panel-title">属性</div>
          <div v-if="!selectedElement" class="empty-tip">选择一个对象后编辑属性</div>
          <el-form v-else label-width="78px" size="small">
            <el-form-item label="名称"><el-input v-model="selectedElement.name" /></el-form-item>
            <div class="prop-grid">
              <el-form-item label="X"><el-input-number v-model="selectedElement.x" :step="0.1" /></el-form-item>
              <el-form-item label="Y"><el-input-number v-model="selectedElement.y" :step="0.1" /></el-form-item>
              <el-form-item label="宽"><el-input-number v-model="selectedElement.width" :step="0.1" /></el-form-item>
              <el-form-item label="高"><el-input-number v-model="selectedElement.height" :step="0.1" /></el-form-item>
            </div>
            <el-form-item label="旋转"><el-input-number v-model="selectedElement.rotate" :min="0" :max="270" :step="90" /></el-form-item>
            <el-form-item label="表达式">
              <el-input v-model="selectedElement.expression" type="textarea" :rows="2" placeholder="例如 {{流水号}} 或 日期：{{生产日期}}" />
            </el-form-item>
            <template v-if="selectedElement.type !== 'line' && selectedElement.type !== 'rect' && selectedElement.type !== 'image'">
              <el-form-item label="字体">
                <el-select v-model="selectedElement.fontFamily" filterable allow-create>
                  <el-option v-for="font in fontOptions" :key="font" :label="font" :value="font" />
                </el-select>
              </el-form-item>
              <el-form-item label="字号"><el-input-number v-model="selectedElement.fontSize" :min="5" :max="96" /></el-form-item>
              <el-form-item label="加粗"><el-switch v-model="selectedElement.bold" /></el-form-item>
              <el-form-item label="对齐"><el-segmented v-model="selectedElement.align" :options="alignOptions" /></el-form-item>
            </template>
            <template v-if="selectedElement.type === 'qr'">
              <el-form-item label="纠错">
                <el-select v-model="selectedElement.errorCorrectionLevel">
                  <el-option label="L" value="L" />
                  <el-option label="M" value="M" />
                  <el-option label="Q" value="Q" />
                  <el-option label="H" value="H" />
                </el-select>
              </el-form-item>
            </template>
            <template v-if="selectedElement.type === 'qr' || selectedElement.type === 'code128'">
              <el-divider content-position="left">扫描内容文字</el-divider>
              <el-form-item label="显示"><el-switch v-model="selectedElement.sourceText.visible" /></el-form-item>
              <el-form-item label="位置">
                <el-select v-model="selectedElement.sourceText.position">
                  <el-option label="上" value="top" />
                  <el-option label="下" value="bottom" />
                  <el-option label="左" value="left" />
                  <el-option label="右" value="right" />
                </el-select>
              </el-form-item>
              <div class="prop-grid">
                <el-form-item label="偏移X"><el-input-number v-model="selectedElement.sourceText.offsetX" controls-position="right" :step="0.1" /></el-form-item>
                <el-form-item label="偏移Y"><el-input-number v-model="selectedElement.sourceText.offsetY" controls-position="right" :step="0.1" /></el-form-item>
              </div>
              <el-form-item label="文字字号"><el-input-number v-model="selectedElement.sourceText.fontSize" :min="5" :max="48" /></el-form-item>
            </template>
            <template v-if="selectedElement.type === 'image'">
              <el-form-item label="地址"><el-input v-model="selectedElement.src" type="textarea" :rows="3" /></el-form-item>
              <el-form-item label="适配">
                <el-select v-model="selectedElement.fit">
                  <el-option label="等比完整" value="contain" />
                  <el-option label="等比裁切" value="cover" />
                  <el-option label="拉伸填充" value="fill" />
                </el-select>
              </el-form-item>
            </template>
            <template v-if="selectedElement.type === 'line' || selectedElement.type === 'rect'">
              <el-form-item label="线宽"><el-input-number v-model="selectedElement.strokeWidth" :min="0.1" :max="8" :step="0.1" /></el-form-item>
            </template>
            <template v-if="selectedElement.type === 'rect'">
              <el-form-item label="填充"><el-switch v-model="selectedElement.fill" /></el-form-item>
            </template>
          </el-form>
        </section>

        <section v-if="selectedElement" class="panel data-config-panel">
          <div class="panel-title">
            <span>对象数据源</span>
            <el-button link type="primary" @click="addObjectDataSource">新增</el-button>
          </div>
          <div class="source-card-list">
            <div v-for="source in selectedElement.dataSources" :key="source.id" class="object-source-card">
              <div class="source-card-main">
                <strong>{{ source.name || "未命名数据源" }}</strong>
                <span>{{ sourceSummary(source) }}</span>
              </div>
              <div class="source-card-actions">
                <el-button link type="primary" @click="insertSource(source.name)">插入</el-button>
                <el-button link type="primary" @click="openSourceDialog(source)">编辑</el-button>
                <el-button link @click="openTransformDialog(source)">转换</el-button>
                <el-button link type="danger" @click="removeObjectDataSource(source.id)">删除</el-button>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </main>

    <el-dialog v-model="paperVisible" title="纸张设置" width="560px">
      <el-form label-width="86px" size="small">
        <el-form-item label="模板名"><el-input v-model="template.name" /></el-form-item>
        <el-form-item label="规格">
          <el-select :model-value="template.paper.name" @change="changePaper">
            <el-option v-for="item in paperPresets" :key="item.name" :label="item.name" :value="item.name" />
            <el-option label="自定义" value="自定义" />
          </el-select>
        </el-form-item>
        <div class="dialog-grid">
          <el-form-item label="宽mm"><el-input-number v-model="template.paper.width" :min="5" :max="300" /></el-form-item>
          <el-form-item label="高mm"><el-input-number v-model="template.paper.height" :min="5" :max="300" /></el-form-item>
          <el-form-item label="边距X"><el-input-number v-model="template.paper.marginX" :min="0" :max="50" :step="0.5" /></el-form-item>
          <el-form-item label="边距Y"><el-input-number v-model="template.paper.marginY" :min="0" :max="50" :step="0.5" /></el-form-item>
          <el-form-item label="间隙"><el-input-number v-model="template.paper.gap" :min="0" :max="20" :step="0.5" /></el-form-item>
          <el-form-item label="浓度"><el-input-number v-model="template.paper.density" :min="0" :max="15" /></el-form-item>
          <el-form-item label="速度"><el-input-number v-model="template.paper.speed" :min="1" :max="8" /></el-form-item>
          <el-form-item label="偏移X"><el-input-number v-model="template.paper.offsetX" :min="-30" :max="30" :step="0.5" /></el-form-item>
          <el-form-item label="偏移Y"><el-input-number v-model="template.paper.offsetY" :min="-30" :max="30" :step="0.5" /></el-form-item>
        </div>
      </el-form>
    </el-dialog>

    <el-dialog v-model="printVisible" :title="testPrint ? '测试打印' : '批量打印'" width="760px">
      <div class="print-summary">预计输出 {{ printPages.length }} 张</div>
      <div class="print-data-list">
        <div v-for="entry in printableSources" :key="entry.key" class="print-source-row">
          <span>{{ entry.element.name }} / {{ entry.source.name }}</span>
          <template v-if="entry.source.sourceType === 'serial'">
            <el-input v-model="entry.source.serial.start" size="small" placeholder="起始" />
            <el-input v-model="entry.source.serial.end" size="small" placeholder="截止" />
            <el-input-number v-model="entry.source.serial.repeat" size="small" :min="1" />
            <el-input-number v-model="entry.source.serial.step" size="small" :min="1" />
          </template>
          <template v-else>
            <el-input v-model="entry.source.manualValue" size="small" />
          </template>
        </div>
      </div>
      <template #footer>
        <el-button @click="printVisible = false">取消</el-button>
        <el-button @click="openPrintPreview(testPrint)">浏览器预览</el-button>
        <el-button type="warning" @click="directPrint(testPrint)">直连打印</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="sourceDialogVisible" title="编辑数据源" width="620px">
      <el-form label-width="92px" size="small">
        <el-form-item label="字段名">
          <el-input v-model="sourceDraft.name" />
        </el-form-item>
        <el-form-item label="数据类型">
          <el-segmented v-model="sourceDraft.valueType" :options="valueTypeOptions" @change="handleSourceValueTypeChange" />
        </el-form-item>
        <el-form-item label="来源类型">
          <el-select v-model="sourceDraft.sourceType" @change="handleSourceTypeChange">
            <el-option v-for="item in sourceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="sourceDraft.sourceType === 'fixed'" label="固定值">
          <el-input v-model="sourceDraft.value" />
        </el-form-item>
        <el-form-item v-if="sourceDraft.sourceType === 'manual'" label="默认值">
          <el-input v-model="sourceDraft.manualValue" />
        </el-form-item>
        <template v-if="sourceDraft.sourceType === 'date'">
          <el-form-item label="日期格式">
            <el-select v-model="sourceDraft.dateFormat" filterable allow-create>
              <el-option label="yyyyMMdd" value="yyyyMMdd" />
              <el-option label="yyyy/MM/dd" value="yyyy/MM/dd" />
              <el-option label="yyyy-MM-dd" value="yyyy-MM-dd" />
              <el-option label="yyyy年MM月dd日" value="yyyy年MM月dd日" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期偏移">
            <el-input-number v-model="sourceDraft.dateOffset" controls-position="right" :step="1" />
          </el-form-item>
        </template>
        <el-form-item v-if="sourceDraft.sourceType === 'time'" label="时间格式">
          <el-input v-model="sourceDraft.timeFormat" />
        </el-form-item>
        <template v-if="sourceDraft.sourceType === 'serial'">
          <div class="dialog-grid">
            <el-form-item label="起始编号"><el-input v-model="sourceDraft.serial.start" /></el-form-item>
            <el-form-item label="截止编号"><el-input v-model="sourceDraft.serial.end" /></el-form-item>
            <el-form-item label="位数"><el-input-number v-model="sourceDraft.serial.digits" controls-position="right" :min="1" :max="12" /></el-form-item>
            <el-form-item label="重复次数"><el-input-number v-model="sourceDraft.serial.repeat" controls-position="right" :min="1" :max="999" /></el-form-item>
            <el-form-item label="步长"><el-input-number v-model="sourceDraft.serial.step" controls-position="right" :min="1" :max="999" /></el-form-item>
          </div>
        </template>
        <el-form-item v-if="sourceDraft.sourceType === 'compose'" label="拼接表达式">
          <el-input v-model="sourceDraft.compose" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item v-if="sourceDraft.sourceType === 'formula'" label="公式">
          <el-input v-model="sourceDraft.formula" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sourceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSourceDialog">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="transformDialogVisible" title="转换设置" width="420px">
      <el-form label-width="72px" size="small">
        <el-form-item label="前缀">
          <el-input v-model="transformDraft.prefix" />
        </el-form-item>
        <el-form-item label="后缀">
          <el-input v-model="transformDraft.suffix" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transformDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTransformDialog">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tsplVisible" title="TSPL2 输出" width="760px">
      <el-input v-model="tsplText" type="textarea" :rows="18" readonly />
      <template #footer>
        <el-button @click="copyTspl">复制</el-button>
        <el-button type="primary" @click="downloadTspl">下载</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Moveable from "vue3-moveable";
import { createForm } from "@formily/core";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  CopyDocument,
  Crop,
  Delete,
  DocumentAdd,
  Download,
  EditPen,
  Grid,
  Minus,
  Picture,
  Printer,
  RefreshLeft,
  RefreshRight,
  Setting,
  Tickets,
  Upload
} from "@element-plus/icons-vue";
import { createDefaultTemplate, templateExamples } from "./templates";
import type { QrLayoutDataTransform, QrLayoutElement, QrLayoutElementType, QrLayoutObjectDataSource, QrLayoutSourceType, QrLayoutTemplate, QrLayoutValueType } from "./types";
import {
  buildCode128Bars,
  buildPrintPages,
  cloneElement,
  createId,
  createObjectDataSource,
  downloadText,
  fontOptions,
  generateBatchTspl,
  paperPresets,
  readFileAsDataUrl,
  readFileAsText,
  renderQr,
  resolveElementValue,
  sourceTextPoint
} from "./utils";

const template = ref<QrLayoutTemplate>(createDefaultTemplate());
const localTemplateKey = "eda-erp-qr-layout-template";
const selectedId = ref("");
const editingId = ref("");
const zoomPercent = ref(100);
const gridSize = ref(0.5);
const showGrid = ref(true);
const shiftPressed = ref(false);
const paperVisible = ref(false);
const printVisible = ref(false);
const testPrint = ref(false);
const tsplVisible = ref(false);
const sourceDialogVisible = ref(false);
const transformDialogVisible = ref(false);
const tsplText = ref("");
const exampleName = ref(templateExamples[0].name);
const templateInputRef = ref<HTMLInputElement>();
const imageInputRef = ref<HTMLInputElement>();
const canvasRef = ref<HTMLDivElement>();
const stageScrollRef = ref<HTMLDivElement>();
const selectedTarget = ref<HTMLElement | null>(null);
const qrCache = reactive<Record<string, string>>({});
const historyStack = ref<string[]>([]);
const redoStack = ref<string[]>([]);
const moveStart = ref({ x: 0, y: 0, width: 0, height: 0, rotate: 0 });
const activeSourceId = ref("");
const sourceForm = createForm();
const transformForm = createForm();
const sourceDraft = reactive<QrLayoutObjectDataSource>(createObjectDataSource("内容"));
const transformDraft = reactive<QrLayoutDataTransform>({ prefix: "", suffix: "" });
let persistTimer: number | undefined;
let printBlobUrl = "";
const alignOptions = [
  { label: "左", value: "left" },
  { label: "中", value: "center" },
  { label: "右", value: "right" }
];
const valueTypeOptions = [
  { label: "文本", value: "text" },
  { label: "数值", value: "number" }
];
const textSourceOptions = [
  { label: "固定值", value: "fixed" },
  { label: "打印输入", value: "manual" },
  { label: "日期", value: "date" },
  { label: "时间", value: "time" },
  { label: "流水号", value: "serial" },
  { label: "拼接", value: "compose" }
];
const numberSourceOptions = [
  { label: "固定值", value: "fixed" },
  { label: "打印输入", value: "manual" },
  { label: "流水号", value: "serial" },
  { label: "公式", value: "formula" }
];

const zoom = computed(() => zoomPercent.value / 12.5);
const selectedElement = computed(() => template.value.elements.find(item => item.id === selectedId.value));
const sortedElements = computed(() => [...template.value.elements].sort((a, b) => a.zIndex - b.zIndex));
const layerElements = computed(() => [...template.value.elements].sort((a, b) => b.zIndex - a.zIndex));
const printPages = computed(() => buildPrintPages(template.value));
const printableSources = computed(() =>
  template.value.elements.flatMap(element =>
    element.dataSources
      .filter(source => source.sourceType === "manual" || source.sourceType === "serial")
      .map(source => ({ key: `${element.id}_${source.id}`, element, source }))
  )
);
const keepRatio = computed(() => shiftPressed.value || selectedElement.value?.type === "qr" || selectedElement.value?.type === "image");
const sourceTypeOptions = computed(() => (sourceDraft.valueType === "number" ? numberSourceOptions : textSourceOptions));
const canvasStyle = computed(() => ({
  width: `${template.value.paper.width * zoom.value}px`,
  height: `${template.value.paper.height * zoom.value}px`,
  backgroundSize: `${gridSize.value * zoom.value}px ${gridSize.value * zoom.value}px`
}));
const moveableGuidelines = computed(() => sortedElements.value.map(item => document.getElementById(item.id)).filter(Boolean) as HTMLElement[]);
const moveableBounds = computed(() => ({ left: 0, top: 0, right: template.value.paper.width * zoom.value, bottom: template.value.paper.height * zoom.value }));

const snapshot = () => {
  historyStack.value.push(JSON.stringify(template.value));
  if (historyStack.value.length > 80) historyStack.value.shift();
  redoStack.value = [];
};

const persistTemplate = () => {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    localStorage.setItem(localTemplateKey, JSON.stringify(template.value));
  }, 300);
};

const loadLocalTemplate = () => {
  const saved = localStorage.getItem(localTemplateKey);
  if (!saved) return false;
  try {
    template.value = JSON.parse(saved);
    selectedId.value = "";
    exampleName.value = template.value.name;
    return true;
  } catch {
    localStorage.removeItem(localTemplateKey);
    return false;
  }
};

const undo = () => {
  if (historyStack.value.length <= 1) return;
  redoStack.value.push(historyStack.value.pop() as string);
  template.value = JSON.parse(historyStack.value[historyStack.value.length - 1]);
  refreshTarget();
};

const redo = () => {
  const next = redoStack.value.pop();
  if (!next) return;
  historyStack.value.push(next);
  template.value = JSON.parse(next);
  refreshTarget();
};

const resetTemplate = async () => {
  await ElMessageBox.confirm("确认新建模板？当前未导出的修改会丢失。", "提示", { type: "warning" });
  template.value = createDefaultTemplate();
  selectedId.value = "";
  exampleName.value = templateExamples[0].name;
  snapshot();
};

const useExample = (name: string) => {
  const found = templateExamples.find(item => item.name === name);
  if (!found) return;
  template.value = JSON.parse(JSON.stringify(found));
  selectedId.value = "";
  snapshot();
};

const triggerImport = () => templateInputRef.value?.click();
const triggerImage = () => imageInputRef.value?.click();

const importTemplate = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    template.value = JSON.parse(await readFileAsText(file));
    selectedId.value = "";
    snapshot();
    ElMessage.success("模板已导入");
  } catch {
    ElMessage.error("模板文件格式不正确");
  } finally {
    input.value = "";
  }
};

const exportTemplate = () => {
  downloadText(`${template.value.name || "qr-layout-template"}.json`, JSON.stringify(template.value, null, 2));
};

const addElement = (type: QrLayoutElementType) => {
  const item = createElementByType(type);
  template.value.elements.push(item);
  selectElement(item.id);
  snapshot();
};

const addImageByFile = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const item = createElementByType("image") as Extract<QrLayoutElement, { type: "image" }>;
  item.name = file.name;
  item.src = await readFileAsDataUrl(file);
  template.value.elements.push(item);
  selectElement(item.id);
  snapshot();
  input.value = "";
};

const createElementByType = (type: QrLayoutElementType): QrLayoutElement => {
  const base = {
    id: createId(type),
    type,
    name: typeName(type),
    expression: "{{内容}}",
    dataSources: [createObjectDataSource("内容")],
    x: 4,
    y: 4,
    width: type === "line" ? 24 : 18,
    height: type === "line" ? 0.4 : 10,
    rotate: 0,
    zIndex: nextZIndex(),
    locked: false,
    visible: true,
    fontSize: 10,
    fontFamily: "Arial",
    bold: false,
    align: "left" as const,
    lineHeight: 1.2
  };
  if (type === "text") return { ...base, type, autoFit: false };
  if (type === "qr") {
    return {
      ...base,
      type,
      width: 16,
      height: 16,
      errorCorrectionLevel: "H",
      sourceText: { visible: false, position: "bottom", offsetX: 0, offsetY: 0, fontSize: 8, fontFamily: "Arial", bold: false }
    };
  }
  if (type === "code128") return { ...base, type, width: 28, height: 12, sourceText: { visible: true, position: "bottom", offsetX: 0, offsetY: 1, fontSize: 8, fontFamily: "Arial", bold: false } };
  if (type === "image") return { ...base, type, src: "", fit: "contain", dither: true };
  if (type === "line") return { ...base, type, dataSources: [], expression: "", strokeWidth: 0.3 };
  return { ...base, type: "rect", dataSources: [], expression: "", width: 24, height: 14, strokeWidth: 0.3, fill: false };
};

const selectElement = async (id: string) => {
  selectedId.value = id;
  editingId.value = "";
  await refreshTarget();
};

const clearSelection = () => {
  selectedId.value = "";
  selectedTarget.value = null;
  editingId.value = "";
};

const refreshTarget = async () => {
  await nextTick();
  selectedTarget.value = selectedId.value ? document.getElementById(selectedId.value) : null;
};

const duplicateSelected = () => {
  if (!selectedElement.value) return;
  const cloned = cloneElement(selectedElement.value);
  template.value.elements.push(cloned);
  selectElement(cloned.id);
  snapshot();
};

const removeSelected = () => removeElement(selectedId.value);
const removeElement = (id: string) => {
  if (!id) return;
  template.value.elements = template.value.elements.filter(item => item.id !== id);
  if (selectedId.value === id) clearSelection();
  snapshot();
};

const addObjectDataSource = () => {
  if (!selectedElement.value) return;
  const source = createObjectDataSource(`数据${selectedElement.value.dataSources.length + 1}`);
  selectedElement.value.dataSources.push(source);
  selectedElement.value.expression += `${selectedElement.value.expression ? "" : ""}{{${source.name}}}`;
  snapshot();
};

const removeObjectDataSource = (id: string) => {
  if (!selectedElement.value) return;
  selectedElement.value.dataSources = selectedElement.value.dataSources.filter(item => item.id !== id);
  snapshot();
};

const insertSource = (name: string) => {
  if (!selectedElement.value) return;
  selectedElement.value.expression += `{{${name}}}`;
};

const openSourceDialog = (source: QrLayoutObjectDataSource) => {
  activeSourceId.value = source.id;
  Object.assign(sourceDraft, JSON.parse(JSON.stringify(source)));
  normalizeSourceDraft();
  sourceForm.setValues(sourceDraft);
  sourceDialogVisible.value = true;
};

const saveSourceDialog = () => {
  const source = selectedElement.value?.dataSources.find(item => item.id === activeSourceId.value);
  if (!source) return;
  normalizeSourceDraft();
  Object.assign(source, JSON.parse(JSON.stringify(sourceDraft)));
  sourceForm.setValues(sourceDraft);
  sourceDialogVisible.value = false;
  snapshot();
};

const openTransformDialog = (source: QrLayoutObjectDataSource) => {
  activeSourceId.value = source.id;
  transformDraft.prefix = source.transform?.prefix || "";
  transformDraft.suffix = source.transform?.suffix || "";
  transformForm.setValues(transformDraft);
  transformDialogVisible.value = true;
};

const saveTransformDialog = () => {
  const source = selectedElement.value?.dataSources.find(item => item.id === activeSourceId.value);
  if (!source) return;
  source.transform = { prefix: transformDraft.prefix, suffix: transformDraft.suffix };
  transformForm.setValues(transformDraft);
  transformDialogVisible.value = false;
  snapshot();
};

const handleSourceValueTypeChange = () => {
  if (sourceDraft.valueType === "number" && !numberSourceOptions.some(item => item.value === sourceDraft.sourceType)) {
    sourceDraft.sourceType = "fixed";
  }
  normalizeSourceDraft();
  sourceForm.setValues(sourceDraft);
};

const handleSourceTypeChange = () => {
  normalizeSourceDraft();
  sourceForm.setValues(sourceDraft);
};

const normalizeSourceDraft = () => {
  if (sourceDraft.valueType === "number" && !numberSourceOptions.some(item => item.value === sourceDraft.sourceType)) {
    sourceDraft.sourceType = "fixed";
  }
  if (!sourceDraft.transform) sourceDraft.transform = { prefix: "", suffix: "" };
  sourceDraft.transform = {
    prefix: sourceDraft.transform.prefix || "",
    suffix: sourceDraft.transform.suffix || ""
  };
};

const sourceSummary = (source: QrLayoutObjectDataSource) => {
  const typeMap: Record<QrLayoutSourceType, string> = {
    fixed: "固定值",
    manual: "打印输入",
    date: `日期 ${source.dateFormat}${source.dateOffset ? ` 偏移${source.dateOffset}` : ""}`,
    time: `时间 ${source.timeFormat}`,
    serial: `流水号 ${source.serial.start}-${source.serial.end}`,
    compose: "拼接",
    formula: "公式"
  };
  const transform = source.transform?.prefix || source.transform?.suffix ? `，转换：${source.transform.prefix || ""}值${source.transform.suffix || ""}` : "";
  return `${source.valueType === "number" ? "数值" : "文本"} / ${typeMap[source.sourceType]}${transform}`;
};

const startTextEdit = async (item: QrLayoutElement) => {
  if (item.type !== "text" || item.locked) return;
  editingId.value = item.id;
  await nextTick();
  (document.querySelector(".element-editor") as HTMLTextAreaElement | null)?.focus();
};

const finishTextEdit = () => {
  editingId.value = "";
  snapshot();
};

const changePaper = (name: string) => {
  const preset = paperPresets.find(item => item.name === name);
  if (preset) template.value.paper = { ...preset };
  if (name === "自定义") template.value.paper.name = "自定义";
  snapshot();
};

const moveLayer = (offset: number) => {
  if (!selectedElement.value) return;
  selectedElement.value.zIndex += offset;
  normalizeZIndex();
  snapshot();
};

const moveTop = () => {
  if (!selectedElement.value) return;
  selectedElement.value.zIndex = nextZIndex();
  normalizeZIndex();
  snapshot();
};

const moveBottom = () => {
  if (!selectedElement.value) return;
  selectedElement.value.zIndex = 0;
  normalizeZIndex();
  snapshot();
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Shift") shiftPressed.value = true;
  const tag = (event.target as HTMLElement).tagName;
  if (["INPUT", "TEXTAREA"].includes(tag) || editingId.value) return;
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    removeSelected();
  }
};

const handleKeyup = (event: KeyboardEvent) => {
  if (event.key === "Shift") shiftPressed.value = false;
};

const handleWheelZoom = (event: WheelEvent) => {
  const oldZoom = zoom.value;
  const nextPercent = Math.min(800, Math.max(10, zoomPercent.value + (event.deltaY > 0 ? -10 : 10)));
  if (nextPercent === zoomPercent.value) return;
  const scroll = stageScrollRef.value;
  if (!scroll) {
    zoomPercent.value = nextPercent;
    return;
  }
  const rect = scroll.getBoundingClientRect();
  const mouseX = event.clientX - rect.left + scroll.scrollLeft;
  const mouseY = event.clientY - rect.top + scroll.scrollTop;
  zoomPercent.value = nextPercent;
  nextTick(() => {
    const scale = zoom.value / oldZoom;
    scroll.scrollLeft = mouseX * scale - (event.clientX - rect.left);
    scroll.scrollTop = mouseY * scale - (event.clientY - rect.top);
    refreshMoveableFrame();
  });
};

const onMoveableStart = () => {
  const item = selectedElement.value;
  if (!item) return;
  moveStart.value = { x: item.x, y: item.y, width: item.width, height: item.height, rotate: item.rotate };
};

const onMoveableDrag = (event: { beforeTranslate: number[] }) => {
  const item = selectedElement.value;
  if (!item) return;
  item.x = clampToPaper(roundByGrid(moveStart.value.x + event.beforeTranslate[0] / zoom.value), "x", item);
  item.y = clampToPaper(roundByGrid(moveStart.value.y + event.beforeTranslate[1] / zoom.value), "y", item);
};

const onMoveableResize = (event: any) => {
  const item = selectedElement.value;
  if (!item) return;
  const translate = event.drag?.beforeTranslate || [0, 0];
  item.x = clampToPaper(roundByGrid(moveStart.value.x + translate[0] / zoom.value), "x", item);
  item.y = clampToPaper(roundByGrid(moveStart.value.y + translate[1] / zoom.value), "y", item);
  item.width = Math.max(0.5, roundByGrid(event.width / zoom.value));
  item.height = Math.max(0.3, roundByGrid(event.height / zoom.value));
  event.target.style.width = `${item.width * zoom.value}px`;
  event.target.style.height = `${item.height * zoom.value}px`;
  event.target.style.left = `${item.x * zoom.value}px`;
  event.target.style.top = `${item.y * zoom.value}px`;
  event.target.style.transform = `rotate(${item.rotate}deg)`;
};

const onMoveableRotate = (event: { beforeRotate: number }) => {
  const item = selectedElement.value;
  if (!item) return;
  item.rotate = Math.round(event.beforeRotate / 90) * 90;
};

const onMoveableEnd = () => {
  snapshot();
  refreshMoveableFrame();
};

const refreshMoveableFrame = async () => {
  selectedTarget.value = null;
  await refreshTarget();
};

const elementStyle = (item: QrLayoutElement) => ({
  left: `${item.x * zoom.value}px`,
  top: `${item.y * zoom.value}px`,
  width: `${item.width * zoom.value}px`,
  height: `${item.height * zoom.value}px`,
  zIndex: item.zIndex,
  transform: `rotate(${item.rotate}deg)`
});

const textStyle = (item: QrLayoutElement) => ({
  fontSize: `${item.fontSize}px`,
  fontFamily: item.fontFamily,
  fontWeight: item.bold ? 700 : 400,
  textAlign: item.align,
  lineHeight: item.lineHeight
});

const sourceTextStyle = (item: Extract<QrLayoutElement, { type: "qr" | "code128" }>) => {
  const point = sourceTextPoint(item);
  return {
    left: `${(point.x - item.x) * zoom.value}px`,
    top: `${(point.y - item.y) * zoom.value}px`,
    width: `${point.width * zoom.value}px`,
    minHeight: `${point.height * zoom.value}px`,
    fontSize: `${item.sourceText.fontSize}px`,
    fontFamily: item.sourceText.fontFamily,
    fontWeight: item.sourceText.bold ? 700 : 400
  };
};

const renderElement = (item: QrLayoutElement) => resolveElementValue(item);

const code128Svg = (content: string) => {
  const data = buildCode128Bars(content);
  const rects = data.bars.map(bar => `<rect x="${bar.x}" y="0" width="${bar.width}" height="48" />`).join("");
  return `<svg viewBox="0 0 ${data.total} 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
};

const openPrintDialog = (onlyFirst: boolean) => {
  testPrint.value = onlyFirst;
  printVisible.value = true;
};

const showTsplDialog = () => {
  tsplText.value = generateBatchTspl(template.value, false);
  tsplVisible.value = true;
};

const copyTspl = async () => {
  await navigator.clipboard.writeText(tsplText.value);
  ElMessage.success("已复制");
};

const downloadTspl = () => {
  downloadText(`${template.value.name}.tspl`, tsplText.value, "text/plain");
};

const directPrint = async (onlyFirst: boolean) => {
  try {
    const response = await fetch("http://127.0.0.1:17620/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tspl: generateBatchTspl(template.value, onlyFirst), template: template.value })
    });
    if (!response.ok) throw new Error("print failed");
    ElMessage.success("已发送到本地打印服务");
  } catch {
    ElMessage.warning("本地打印服务未启动，后续完成服务后可直连打印");
  }
};

const openPrintPreview = async (onlyFirst: boolean) => {
  const pdfBlob = await buildPrintPdf(onlyFirst);
  if (printBlobUrl) URL.revokeObjectURL(printBlobUrl);
  printBlobUrl = URL.createObjectURL(pdfBlob);
  const win = window.open(printBlobUrl, "_blank");
  if (!win) {
    URL.revokeObjectURL(printBlobUrl);
    printBlobUrl = "";
    ElMessage.warning("浏览器拦截了打印预览窗口，请允许弹窗后重试");
  }
};

const buildPrintPdf = async (onlyFirst: boolean) => {
  const pages = onlyFirst ? printPages.value.slice(0, 1) : printPages.value;
  const paper = template.value.paper;
  const pdf = new jsPDF({
    unit: "mm",
    format: [paper.width, paper.height],
    orientation: paper.width > paper.height ? "landscape" : "portrait",
    compress: true
  });
  const host = document.createElement("div");
  host.className = "qr-pdf-render-host";
  host.style.cssText = "position:fixed;left:-10000px;top:0;background:#fff;z-index:-1;";
  document.body.appendChild(host);
  try {
    for (let index = 0; index < pages.length; index++) {
      const pageNode = document.createElement("div");
      pageNode.style.cssText = `position:relative;width:${paper.width}mm;height:${paper.height}mm;overflow:hidden;background:#fff;`;
      pageNode.innerHTML = (await Promise.all(sortedElements.value.filter(item => item.visible).map(item => renderPrintElement(item, pages[index])))).join("");
      host.innerHTML = "";
      host.appendChild(pageNode);
      await waitForImages(pageNode);
      const canvas = await html2canvas(pageNode, {
        backgroundColor: "#ffffff",
        scale: 3,
        useCORS: true,
        logging: false
      });
      if (index > 0) pdf.addPage([paper.width, paper.height], paper.width > paper.height ? "landscape" : "portrait");
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, paper.width, paper.height, undefined, "FAST");
    }
    return pdf.output("blob");
  } finally {
    document.body.removeChild(host);
  }
};

const buildPrintHtml = async (pages: ReturnType<typeof buildPrintPages>) => {
  const paper = template.value.paper;
  const pageHtml = await Promise.all(
    pages.map(async page => {
      const elementHtml = await Promise.all(sortedElements.value.filter(item => item.visible).map(item => renderPrintElement(item, page)));
      return `<section class="print-page">${elementHtml.join("")}</section>`;
    })
  );
  return `<!doctype html><html><head><meta charset="utf-8" /><title>${template.value.name}</title><style>
@page { size: ${paper.width}mm ${paper.height}mm; margin: 0; }
* { box-sizing: border-box; } body { margin: 0; background: #f3f4f6; }
.print-toolbar { position: sticky; top: 0; z-index: 10000; display: flex; gap: 8px; align-items: center; justify-content: center; padding: 10px; background: #fff; border-bottom: 1px solid #ddd; }
.print-toolbar button { height: 32px; padding: 0 14px; cursor: pointer; border: 1px solid #cfd6df; border-radius: 4px; background: #fff; }
.print-toolbar .primary { color: #fff; background: #2563eb; border-color: #2563eb; }
.print-page { position: relative; width: ${paper.width}mm; height: ${paper.height}mm; margin: 8px auto; overflow: hidden; background: #fff; page-break-after: always; }
.item { position: absolute; overflow: visible; transform-origin: center center; }
.text { white-space: pre-wrap; word-break: break-all; overflow:hidden; }
.source { position: absolute; text-align: center; white-space: pre-wrap; word-break: break-all; }
.rect { width: 100%; height: 100%; border: 0.3mm solid #000; } svg, img { width: 100%; height: 100%; display: block; }
@media print { body { background: #fff; } .print-toolbar { display: none; } .print-page { margin: 0; } }
</style></head><body>
<div class="print-toolbar">
  <button class="primary" onclick="requestAnimationFrame(function(){window.focus();window.print();})">打印</button>
  <button onclick="window.close()">关闭</button>
  <span>${escapeHtml(template.value.name)}，共 ${pageHtml.length} 张</span>
</div>
${pageHtml.join("")}
</body></html>`;
};

const renderPrintElement = async (item: QrLayoutElement, page: ReturnType<typeof buildPrintPages>[number]) => {
  const common = `left:${item.x}mm;top:${item.y}mm;width:${item.width}mm;height:${item.height}mm;z-index:${item.zIndex};transform:rotate(${item.rotate}deg);`;
  const value = resolveElementValue(item, page);
  if (item.type === "text") {
    const style = `${common}font:${item.bold ? 700 : 400} ${item.fontSize}px/${item.lineHeight} ${item.fontFamily};text-align:${item.align};`;
    return `<div class="item text" style="${style}">${escapeHtml(value)}</div>`;
  }
  if (item.type === "qr") {
    const src = await renderQr(value, 256, item.errorCorrectionLevel);
    return `<div class="item" style="${common}"><img src="${src}" />${sourcePrintHtml(item, value)}</div>`;
  }
  if (item.type === "code128") return `<div class="item" style="${common}">${code128Svg(value)}${sourcePrintHtml(item, value)}</div>`;
  if (item.type === "image") return `<div class="item" style="${common}"><img src="${item.src}" style="object-fit:${item.fit};" /></div>`;
  if (item.type === "line") return `<div class="item" style="${common}border-top:${item.strokeWidth}mm solid #000;"></div>`;
  return `<div class="item" style="${common}"><div class="rect" style="border-width:${item.strokeWidth}mm;${item.fill ? "background:#000;" : ""}"></div></div>`;
};

const sourcePrintHtml = (item: Extract<QrLayoutElement, { type: "qr" | "code128" }>, value: string) => {
  if (!item.sourceText.visible) return "";
  const point = sourceTextPoint(item);
  const style = `left:${point.x - item.x}mm;top:${point.y - item.y}mm;width:${point.width}mm;font:${item.sourceText.bold ? 700 : 400} ${item.sourceText.fontSize}px ${item.sourceText.fontFamily};`;
  return `<div class="source" style="${style}">${escapeHtml(value)}</div>`;
};

const waitForImages = async (root: HTMLElement) => {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      image =>
        new Promise<void>(resolve => {
          if (image.complete) {
            resolve();
            return;
          }
          image.onload = () => resolve();
          image.onerror = () => resolve();
        })
    )
  );
};

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const typeName = (type: QrLayoutElementType) => ({ text: "文本", qr: "二维码", code128: "Code128", image: "图片", line: "线条", rect: "矩形" })[type];
const nextZIndex = () => Math.max(0, ...template.value.elements.map(item => item.zIndex)) + 1;
const normalizeZIndex = () => sortedElements.value.forEach((item, index) => (item.zIndex = index + 1));
const roundByGrid = (value: number) => (showGrid.value ? Math.round(value / gridSize.value) * gridSize.value : Math.round(value * 10) / 10);
const clampToPaper = (value: number, axis: "x" | "y", item: QrLayoutElement) => {
  const max = axis === "x" ? template.value.paper.width - item.width : template.value.paper.height - item.height;
  return Math.min(Math.max(value, 0), Math.max(max, 0));
};

watch(
  () => template.value.elements,
  async () => {
    await nextTick();
    await Promise.all(
      template.value.elements
        .filter((item): item is Extract<QrLayoutElement, { type: "qr" }> => item.type === "qr")
        .map(async item => {
          qrCache[item.id] = await renderQr(resolveElementValue(item), 256, item.errorCorrectionLevel);
        })
    );
    refreshTarget();
  },
  { deep: true, immediate: true }
);

watch(
  template,
  () => {
    persistTemplate();
  },
  { deep: true }
);

onMounted(() => {
  loadLocalTemplate();
  snapshot();
});

onBeforeUnmount(() => {
  window.clearTimeout(persistTimer);
  if (printBlobUrl) URL.revokeObjectURL(printBlobUrl);
  selectedTarget.value = null;
});
</script>

<style scoped lang="scss">
.qr-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #1f2937;
  background: #eef1f5;
}

.qr-layout__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 8px 12px;
  background: #ffffff;
  border-bottom: 1px solid #d8dde6;
}

.toolbar-group,
.layer-actions,
.layer-actions-inline,
.source-title,
.source-switches {
  display: flex;
  gap: 8px;
  align-items: center;
}

.example-select {
  width: 170px;
}

.grid-select {
  width: 88px;
}

.zoom-slider {
  width: 160px;
}

.zoom-text {
  width: 54px;
  font-size: 12px;
  color: #667085;
}

.hidden-input {
  display: none;
}

.qr-layout__body {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) 380px;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.qr-layout__left,
.qr-layout__right {
  min-height: 0;
  padding: 12px;
  overflow: auto;
  background: #f8fafc;
}

.qr-layout__left {
  border-right: 1px solid #d8dde6;
}

.qr-layout__right {
  border-left: 1px solid #d8dde6;
}

.panel {
  padding: 12px;
  margin-bottom: 12px;
  background: #ffffff;
  border: 1px solid #e3e7ee;
  border-radius: 6px;
}

.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 600;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  :deep(.el-button) {
    justify-content: flex-start;
    width: 100%;
    height: 36px;
    margin: 0;
  }
}

.template-list {
  display: grid;
  gap: 8px;
}

.template-card {
  display: grid;
  gap: 4px;
  padding: 8px;
  color: #1f2937;
  text-align: left;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 5px;
}

.qr-layout__stage {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.stage-head {
  display: flex;
  justify-content: space-between;
  padding: 8px 14px;
  font-size: 13px;
  color: #475467;
  background: #f8fafc;
  border-bottom: 1px solid #d8dde6;
}

.stage-scroll {
  position: relative;
  display: block;
  flex: 1;
  min-height: 0;
  padding: 40px;
  overflow: auto;
}

.stage-scroll::-webkit-scrollbar,
.qr-layout__left::-webkit-scrollbar,
.qr-layout__right::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.stage-scroll::-webkit-scrollbar-thumb,
.qr-layout__left::-webkit-scrollbar-thumb,
.qr-layout__right::-webkit-scrollbar-thumb {
  background: #b7c0cc;
  border: 3px solid #eef1f5;
  border-radius: 10px;
}

.label-canvas {
  position: relative;
  margin: 0 auto;
  background-color: #ffffff;
  border: 1px solid #111827;
  box-shadow: 0 12px 30px rgb(15 23 42 / 14%);
}

.label-canvas.is-grid {
  background-image:
    linear-gradient(to right, rgb(17 24 39 / 8%) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(17 24 39 / 8%) 1px, transparent 1px);
}

.label-element {
  position: absolute;
  overflow: visible;
  transform-origin: center center;
  cursor: move;
  user-select: none;
}

.label-element.is-selected {
  outline: 1px solid #2563eb;
}

.label-element.is-locked {
  cursor: not-allowed;
}

.element-text,
.element-editor {
  width: 100%;
  height: 100%;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-all;
}

.element-editor {
  padding: 0;
  color: #111827;
  resize: none;
  background: rgb(255 255 255 / 92%);
  border: 1px solid #2563eb;
  outline: none;
}

.element-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.fit-cover {
  object-fit: cover;
}

.fit-fill {
  object-fit: fill;
}

.barcode-box,
.barcode-box :deep(svg) {
  width: 100%;
  height: 100%;
}

.source-text {
  position: absolute;
  color: #111827;
  line-height: 1.15;
  text-align: center;
  white-space: pre-wrap;
  word-break: break-all;
  pointer-events: none;
}

.element-line {
  width: 100%;
  background: #000000;
}

.element-rect {
  width: 100%;
  height: 100%;
  border: solid #000000;
}

.element-rect.fill {
  background: #000000;
}

.layer-list {
  display: grid;
  gap: 6px;
  max-height: 230px;
  overflow: auto;
}

.layer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.layer-row.active {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #93c5fd;
}

.layer-actions {
  flex-wrap: wrap;
  margin-top: 8px;
}

.empty-tip,
.print-summary {
  font-size: 12px;
  color: #667085;
}

.prop-grid,
.dialog-grid,
.source-grid,
.serial-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 8px;
}

.source-card-list {
  display: grid;
  gap: 8px;
}

.object-source-card {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.source-card-main {
  display: grid;
  gap: 4px;
  min-width: 0;

  span {
    overflow: hidden;
    font-size: 12px;
    color: #667085;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.source-card-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
}

.print-data-list {
  display: grid;
  gap: 8px;
  max-height: 420px;
  overflow: auto;
}

.print-source-row {
  display: grid;
  grid-template-columns: 160px repeat(4, minmax(0, 1fr));
  gap: 6px;
  align-items: center;
}
</style>
