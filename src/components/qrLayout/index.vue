<template>
  <div class="qr-layout" tabindex="0" @keydown="handleKeydown" @keyup="handleKeyup">
    <header class="qr-layout__toolbar">
      <div class="toolbar-group">
        <el-button type="primary" @click="openCreateTemplateDialog('blank')"><el-icon><DocumentAdd /></el-icon>新建</el-button>
        <el-select v-model="activeTemplateKey" class="example-select" @change="handleTemplateSelect">
          <el-option v-for="item in templateOptions" :key="item.key" :label="item.template.name" :value="item.key" />
          <el-option label="新增模板" :value="newTemplateSelectValue" />
        </el-select>
        <el-button @click="paperVisible = true"><el-icon><Setting /></el-icon>纸张</el-button>
        <el-button type="primary" plain @click="saveCurrentTemplate"><el-icon><Download /></el-icon>{{ activeTemplateOption?.source === "server" && activeTemplateOption.editable ? "保存" : "保存到后端" }}</el-button>
        <el-button v-if="activeTemplateOption?.source === 'server' && activeTemplateOption.record?.visibility === 'private' && activeTemplateOption.editable" type="success" plain @click="publishCurrentTemplate">公开</el-button>
        <el-button v-if="activeTemplateOption?.source === 'server' && activeTemplateOption.record?.visibility === 'public' && activeTemplateOption.editable" type="warning" plain @click="unpublishCurrentTemplate">取消公开</el-button>
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
            <div
              v-for="item in templateOptions"
              :key="item.key"
              class="template-card"
              :class="{ active: activeTemplateKey === item.key }"
              @click="useTemplate(item.key)"
            >
              <div class="template-card__main">
                <strong>{{ item.template.name }}</strong>
                <span class="template-card__meta">{{ item.template.paper.width }} x {{ item.template.paper.height }}mm</span>
                <div class="template-card__tags">
                  <span class="template-card__tag" :class="`is-${item.source === 'server' ? item.record?.visibility : item.source}`">{{ templateOptionTag(item) }}</span>
                  <span v-if="item.record?.ownerUserName" class="template-card__owner">{{ item.record.ownerUserName }}</span>
                </div>
              </div>
              <div class="template-card__actions">
                <el-button link type="primary" @click.stop="copyTemplate(item)">复制</el-button>
                <el-button v-if="item.source !== 'server'" link type="success" @click.stop="saveTemplateToServer(item)">入库</el-button>
                <template v-if="!item.builtin && item.editable">
                  <el-button link type="primary" @click.stop="renameTemplate(item)">重命名</el-button>
                  <el-button link type="danger" @click.stop="removeTemplate(item)">删除</el-button>
                </template>
              </div>
            </div>
            <button class="template-add-card" @click="openCreateTemplateDialog('blank')">
              <el-icon><Plus /></el-icon>
              <span>新增模板</span>
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

    <el-dialog v-model="templateDialogVisible" title="新增模板" width="920px" class="template-create-dialog">
      <div class="template-create">
        <el-form label-width="92px" size="small" class="template-create__form">
          <el-form-item label="创建方式">
            <el-segmented v-model="templateDraft.source" :options="templateSourceOptions" @change="syncTemplateDraftFromSource" />
          </el-form-item>
          <el-form-item v-if="templateDraft.source === 'example'" label="示例模板">
            <el-select v-model="templateDraft.exampleName" @change="syncTemplateDraftFromSource">
              <el-option v-for="item in templateOptions" :key="item.template.name" :label="item.template.name" :value="item.template.name" />
            </el-select>
          </el-form-item>
          <el-form-item label="模板名">
            <el-input v-model="templateDraft.name" maxlength="40" show-word-limit />
          </el-form-item>
          <el-form-item label="规格">
            <el-select v-model="templateDraft.paperName" @change="changeTemplateDraftPaper">
              <el-option v-for="item in paperPresets" :key="item.name" :label="item.name" :value="item.name" />
              <el-option label="自定义" value="自定义" />
            </el-select>
          </el-form-item>
          <div class="dialog-grid">
            <el-form-item label="宽mm"><el-input-number v-model="templateDraft.width" :min="5" :max="300" /></el-form-item>
            <el-form-item label="高mm"><el-input-number v-model="templateDraft.height" :min="5" :max="300" /></el-form-item>
            <el-form-item label="边距X"><el-input-number v-model="templateDraft.marginX" :min="0" :max="50" :step="0.5" /></el-form-item>
            <el-form-item label="边距Y"><el-input-number v-model="templateDraft.marginY" :min="0" :max="50" :step="0.5" /></el-form-item>
            <el-form-item label="间隙"><el-input-number v-model="templateDraft.gap" :min="0" :max="20" :step="0.5" /></el-form-item>
            <el-form-item label="圆角"><el-input-number v-model="templateDraft.borderRadius" :min="0" :max="50" :step="0.5" /></el-form-item>
            <el-form-item label="浓度"><el-input-number v-model="templateDraft.density" :min="0" :max="15" /></el-form-item>
            <el-form-item label="速度"><el-input-number v-model="templateDraft.speed" :min="1" :max="8" /></el-form-item>
            <el-form-item label="偏移X"><el-input-number v-model="templateDraft.offsetX" :min="-30" :max="30" :step="0.5" /></el-form-item>
            <el-form-item label="偏移Y"><el-input-number v-model="templateDraft.offsetY" :min="-30" :max="30" :step="0.5" /></el-form-item>
          </div>
          <div class="dialog-grid">
            <el-form-item label="方向">
              <el-segmented v-model="templateDraft.direction" :options="directionOptions" />
            </el-form-item>
            <el-form-item label="模式">
              <el-select v-model="templateDraft.mode">
                <el-option label="间隙纸" value="gap" />
                <el-option label="黑标纸" value="blackMark" />
              </el-select>
            </el-form-item>
            <el-form-item label="边框">
              <el-switch v-model="templateDraft.borderVisible" />
            </el-form-item>
            <el-form-item label="边框线宽">
              <el-input-number v-model="templateDraft.borderWidth" :disabled="!templateDraft.borderVisible" :min="0.1" :max="5" :step="0.1" />
            </el-form-item>
          </div>
        </el-form>
        <div class="template-preview-panel">
          <div class="template-preview-title">实时预览</div>
          <div class="template-preview-wrap">
            <div class="template-preview-paper" :style="templatePreviewStyle">
              <div class="template-preview-margin" :style="templatePreviewMarginStyle"></div>
              <span class="template-preview-size template-preview-size--top">{{ templateDraft.width }}mm</span>
              <span class="template-preview-size template-preview-size--left">{{ templateDraft.height }}mm</span>
            </div>
          </div>
          <div class="template-preview-meta">
            <span>{{ templateDraft.width }} x {{ templateDraft.height }}mm</span>
            <span>边距 {{ templateDraft.marginX }} / {{ templateDraft.marginY }}mm</span>
            <span>{{ templateDraft.borderRadius ? `圆角 ${templateDraft.borderRadius}mm` : "直角" }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTemplateDraft">创建</el-button>
      </template>
    </el-dialog>

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
          <el-form-item label="圆角"><el-input-number v-model="template.paper.borderRadius" :min="0" :max="50" :step="0.5" /></el-form-item>
          <el-form-item label="边框"><el-switch v-model="template.paper.borderVisible" /></el-form-item>
          <el-form-item label="边框线宽"><el-input-number v-model="template.paper.borderWidth" :disabled="!template.paper.borderVisible" :min="0.1" :max="5" :step="0.1" /></el-form-item>
        </div>
      </el-form>
    </el-dialog>

    <el-dialog v-model="printVisible" :title="testPrint ? '测试打印' : '批量打印'" width="760px">
      <div class="print-summary">预计输出 {{ currentPrintPages.length }} 张</div>
      <div class="print-quantity-row">
        <span>打印数量</span>
        <el-input-number v-model="printQuantity" size="small" :min="1" :max="99999" controls-position="right" />
      </div>
      <div class="print-data-list">
        <div v-for="entry in printableSources" :key="entry.key" class="print-source-row">
          <span>{{ entry.element.name }} / {{ entry.source.name }}</span>
          <el-input v-model="entry.source.manualValue" size="small" />
        </div>
      </div>
      <template #footer>
        <el-button @click="printVisible = false">取消</el-button>
        <el-button type="primary" plain @click="openPdfPreview(testPrint)">生成PDF</el-button>
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
            <el-form-item label="方向">
              <el-select v-model="sourceDraft.serial.direction">
                <el-option label="递增" value="increment" />
                <el-option label="递减" value="decrement" />
              </el-select>
            </el-form-item>
            <el-form-item label="公差"><el-input-number v-model="sourceDraft.serial.step" controls-position="right" :min="1" :max="999" /></el-form-item>
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
import { jsPDF } from "jspdf";
import printJS from "print-js";
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
  Plus,
  Printer,
  RefreshLeft,
  RefreshRight,
  Setting,
  Tickets,
  Upload
} from "@element-plus/icons-vue";
import {
  copyQrLayoutTemplate,
  createQrLayoutTemplate,
  deleteQrLayoutTemplate,
  getQrLayoutTemplateDetail,
  getQrLayoutTemplateList,
  publishQrLayoutTemplate,
  unpublishQrLayoutTemplate,
  updateQrLayoutTemplate
} from "@/api/modules/qrLayout";
import type { QrLayoutTemplateRecord } from "@/api/interface/qrLayout";
import { createDefaultTemplate, templateExamples } from "./templates";
import type { QrLayoutDataTransform, QrLayoutElement, QrLayoutElementType, QrLayoutObjectDataSource, QrLayoutPaper, QrLayoutSourceType, QrLayoutTemplate, QrLayoutValueType } from "./types";
import {
  buildCode128Bars,
  buildPrintPages,
  cloneElement,
  createId,
  createObjectDataSource,
  downloadText,
  fontOptions,
  generateBatchTspl,
  normalizeSerialRule,
  paperPresets,
  readFileAsDataUrl,
  readFileAsText,
  renderQr,
  resolveElementValue,
  sourceTextPoint
} from "./utils";

const template = ref<QrLayoutTemplate>(createDefaultTemplate());
const localTemplateKey = "eda-erp-qr-layout-template";
const customTemplateKey = "eda-erp-qr-layout-template-list";
const savedTemplateKey = "eda-erp-qr-layout-saved-template-map";
const newTemplateSelectValue = "__create_template__";
type TemplateSource = "blank" | "current" | "example";
type TemplateOptionSource = "builtin" | "local" | "server";
interface TemplateDraft {
  name: string;
  source: TemplateSource;
  exampleName: string;
  paperName: string;
  width: number;
  height: number;
  marginX: number;
  marginY: number;
  gap: number;
  direction: 0 | 1;
  density: number;
  speed: number;
  offsetX: number;
  offsetY: number;
  mode: QrLayoutPaper["mode"];
  borderRadius: number;
  borderVisible: boolean;
  borderWidth: number;
}
interface ServerTemplateItem extends QrLayoutTemplateRecord {
  template: QrLayoutTemplate;
}
interface TemplateLibraryOption {
  key: string;
  template: QrLayoutTemplate;
  source: TemplateOptionSource;
  builtin: boolean;
  editable: boolean;
  record?: ServerTemplateItem;
}
const selectedId = ref("");
const editingId = ref("");
const zoomPercent = ref(100);
const gridSize = ref(0.5);
const showGrid = ref(true);
const shiftPressed = ref(false);
const paperVisible = ref(false);
const printVisible = ref(false);
const testPrint = ref(false);
const printQuantity = ref(1);
const tsplVisible = ref(false);
const sourceDialogVisible = ref(false);
const transformDialogVisible = ref(false);
const templateDialogVisible = ref(false);
const tsplText = ref("");
const exampleName = ref(templateExamples[0].name);
const activeTemplateName = ref(templateExamples[0].name);
const activeTemplateKey = ref(`builtin:${templateExamples[0].name}`);
const customTemplates = ref<QrLayoutTemplate[]>([]);
const savedTemplates = ref<Record<string, QrLayoutTemplate>>({});
const workingTemplates = ref<Record<string, QrLayoutTemplate>>({});
const serverTemplates = ref<ServerTemplateItem[]>([]);
const localCurrentTemplate = ref<QrLayoutTemplate | null>(null);
const defaultDraftPaper = paperPresets[2];
const templateDraft = reactive<TemplateDraft>({
  name: "新模板",
  source: "blank",
  exampleName: templateExamples[0].name,
  paperName: defaultDraftPaper.name,
  width: defaultDraftPaper.width,
  height: defaultDraftPaper.height,
  marginX: defaultDraftPaper.marginX,
  marginY: defaultDraftPaper.marginY,
  gap: defaultDraftPaper.gap,
  direction: defaultDraftPaper.direction,
  density: defaultDraftPaper.density,
  speed: defaultDraftPaper.speed,
  offsetX: defaultDraftPaper.offsetX,
  offsetY: defaultDraftPaper.offsetY,
  mode: defaultDraftPaper.mode,
  borderRadius: 0,
  borderVisible: false,
  borderWidth: 0.3
});
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
let printing = false;
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
const templateSourceOptions = [
  { label: "空白", value: "blank" },
  { label: "复制当前", value: "current" },
  { label: "基于示例", value: "example" }
];
const directionOptions = [
  { label: "正向", value: 0 },
  { label: "旋转", value: 1 }
];

const cssPxPerMm = 96 / 25.4;
const pdfTextScale = 6;
const zoom = computed(() => zoomPercent.value / 12.5);
const previewFontScale = computed(() => zoom.value / cssPxPerMm);
const selectedElement = computed(() => template.value.elements.find(item => item.id === selectedId.value));
const sortedElements = computed(() => [...template.value.elements].sort((a, b) => a.zIndex - b.zIndex));
const layerElements = computed(() => [...template.value.elements].sort((a, b) => b.zIndex - a.zIndex));
const currentPrintPages = computed(() => buildPrintPages(template.value, testPrint.value ? 1 : printQuantity.value));
const printableSources = computed(() =>
  template.value.elements.flatMap(element =>
    element.dataSources
      .filter(source => source.sourceType === "manual")
      .map(source => ({ key: `${element.id}_${source.id}`, element, source }))
  )
);
const keepRatio = computed(() => shiftPressed.value || selectedElement.value?.type === "qr" || selectedElement.value?.type === "image");
const sourceTypeOptions = computed(() => (sourceDraft.valueType === "number" ? numberSourceOptions : textSourceOptions));
const templateOptions = computed<TemplateLibraryOption[]>(() => [
  ...serverTemplates.value.map(item => ({
    key: `server:${item.id}`,
    template: normalizeTemplate(item.template),
    source: "server" as const,
    builtin: false,
    editable: item.editable,
    record: item
  })),
  ...(localCurrentTemplate.value
    ? [
        {
          key: "local:current",
          template: normalizeTemplate(localCurrentTemplate.value),
          source: "local" as const,
          builtin: false,
          editable: true
        }
      ]
    : []),
  ...templateExamples.map(item => {
    const saved = savedTemplates.value[item.name];
    const working = workingTemplates.value[item.name];
    return {
      key: `builtin:${item.name}`,
      template: normalizeTemplate(working || saved || item),
      source: "builtin" as const,
      builtin: true,
      editable: true
    };
  }),
  ...customTemplates.value.map(item => {
    const working = workingTemplates.value[item.name];
    return {
      key: `local:${item.name}`,
      template: normalizeTemplate(working || item),
      source: "local" as const,
      builtin: false,
      editable: true
    };
  })
]);
const activeTemplateOption = computed(() => templateOptions.value.find(item => item.key === activeTemplateKey.value));
const canvasStyle = computed(() => ({
  width: `${template.value.paper.width * zoom.value}px`,
  height: `${template.value.paper.height * zoom.value}px`,
  backgroundSize: `${gridSize.value * zoom.value}px ${gridSize.value * zoom.value}px`,
  borderRadius: `${templateBorderRadius(template.value.paper) * zoom.value}px`,
  border: template.value.paper.borderVisible ? `${Math.max(templateBorderWidth(template.value.paper) * zoom.value, 1)}px solid #111827` : "1px solid #111827"
}));
const moveableGuidelines = computed(() => sortedElements.value.map(item => document.getElementById(item.id)).filter(Boolean) as HTMLElement[]);
const moveableBounds = computed(() => ({ left: 0, top: 0, right: template.value.paper.width * zoom.value, bottom: template.value.paper.height * zoom.value }));
const templatePreviewScale = computed(() => Math.min(280 / Math.max(templateDraft.width, 1), 190 / Math.max(templateDraft.height, 1)));
const templatePreviewStyle = computed(() => ({
  width: `${templateDraft.width * templatePreviewScale.value}px`,
  height: `${templateDraft.height * templatePreviewScale.value}px`,
  borderRadius: `${templateDraft.borderRadius * templatePreviewScale.value}px`,
  border: templateDraft.borderVisible ? `${Math.max(templateDraft.borderWidth * templatePreviewScale.value, 1)}px solid #111827` : "1px dashed #98a2b3"
}));
const templatePreviewMarginStyle = computed(() => ({
  left: `${templateDraft.marginX * templatePreviewScale.value}px`,
  right: `${templateDraft.marginX * templatePreviewScale.value}px`,
  top: `${templateDraft.marginY * templatePreviewScale.value}px`,
  bottom: `${templateDraft.marginY * templatePreviewScale.value}px`,
  borderRadius: `${Math.max((templateDraft.borderRadius - Math.max(templateDraft.marginX, templateDraft.marginY)) * templatePreviewScale.value, 0)}px`
}));

const templateBorderRadius = (paper: QrLayoutPaper) => paper.borderRadius ?? 0;
const templateBorderWidth = (paper: QrLayoutPaper) => paper.borderWidth ?? 0.3;
const templateBorderVisible = (paper: QrLayoutPaper) => paper.borderVisible ?? false;
const normalizePaper = (paper: QrLayoutPaper): QrLayoutPaper => ({
  ...paper,
  borderRadius: templateBorderRadius(paper),
  borderVisible: templateBorderVisible(paper),
  borderWidth: templateBorderWidth(paper)
});
const normalizeElement = (item: QrLayoutElement): QrLayoutElement => ({
  ...item,
  dataSources: item.dataSources.map(source => ({
    ...source,
    serial: normalizeSerialRule(source.serial),
    transform: source.transform || { prefix: "", suffix: "" }
  }))
});
const normalizeTemplate = (item: QrLayoutTemplate): QrLayoutTemplate => ({
  ...item,
  paper: normalizePaper(item.paper),
  elements: item.elements.map(normalizeElement)
});
const cloneTemplate = (item: QrLayoutTemplate): QrLayoutTemplate => normalizeTemplate(JSON.parse(JSON.stringify(item)));
const templateJson = (item: QrLayoutTemplate) => JSON.stringify(normalizeTemplate(item));
const templateOptionTag = (item: TemplateLibraryOption) => {
  if (item.source === "builtin") return "内置";
  if (item.source === "local") return "本地";
  if (item.source !== "server") return "本地";
  return item.record?.visibility === "public" ? "公开" : "我的";
};
const parseServerTemplate = (record: QrLayoutTemplateRecord): ServerTemplateItem | null => {
  if (!record.templateJson) return null;
  try {
    const parsed = normalizeTemplate(JSON.parse(record.templateJson));
    parsed.name = record.name || parsed.name;
    return { ...record, template: parsed };
  } catch {
    return null;
  }
};
const uniqueTemplateName = (name: string) => {
  const baseName = name.trim() || "新模板";
  const names = new Set(templateOptions.value.map(item => item.template.name));
  if (!names.has(baseName)) return baseName;
  let index = 2;
  while (names.has(`${baseName}${index}`)) index++;
  return `${baseName}${index}`;
};

const snapshot = () => {
  historyStack.value.push(JSON.stringify(template.value));
  if (historyStack.value.length > 80) historyStack.value.shift();
  redoStack.value = [];
};

const persistTemplate = () => {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    localStorage.setItem(localTemplateKey, JSON.stringify(normalizeTemplate(template.value)));
  }, 300);
};

const persistCustomTemplates = () => {
  localStorage.setItem(customTemplateKey, JSON.stringify(customTemplates.value.map(normalizeTemplate)));
};

const persistSavedTemplates = () => {
  localStorage.setItem(
    savedTemplateKey,
    JSON.stringify(Object.fromEntries(Object.entries(savedTemplates.value).map(([name, item]) => [name, normalizeTemplate(item)])))
  );
};

const stashActiveTemplate = () => {
  const option = activeTemplateOption.value;
  if (!option || !activeTemplateName.value) return;
  const activeTemplate = cloneTemplate(template.value);
  activeTemplate.name = activeTemplateName.value;
  if (option.source === "server" && option.record?.id) {
    serverTemplates.value = serverTemplates.value.map(item => (item.id === option.record?.id ? { ...item, template: activeTemplate } : item));
    return;
  }
  if (option.key === "local:current") {
    localCurrentTemplate.value = activeTemplate;
    return;
  }
  workingTemplates.value = {
    ...workingTemplates.value,
    [option.template.name]: activeTemplate
  };
};

const loadCustomTemplates = () => {
  const saved = localStorage.getItem(customTemplateKey);
  if (!saved) return;
  try {
    customTemplates.value = JSON.parse(saved).map(normalizeTemplate);
  } catch {
    localStorage.removeItem(customTemplateKey);
  }
};

const loadSavedTemplates = () => {
  const saved = localStorage.getItem(savedTemplateKey);
  if (!saved) return;
  try {
    savedTemplates.value = Object.fromEntries(
      Object.entries(JSON.parse(saved)).map(([name, item]) => [name, normalizeTemplate(item as QrLayoutTemplate)])
    );
  } catch {
    localStorage.removeItem(savedTemplateKey);
  }
};

const loadLocalTemplate = () => {
  const saved = localStorage.getItem(localTemplateKey);
  if (!saved) return false;
  try {
    const localTemplate = normalizeTemplate(JSON.parse(saved));
    localCurrentTemplate.value = cloneTemplate(localTemplate);
    template.value = localTemplate;
    selectedId.value = "";
    exampleName.value = "local:current";
    activeTemplateKey.value = "local:current";
    activeTemplateName.value = template.value.name;
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

const useTemplate = (key: string) => {
  if (activeTemplateKey.value === key) {
    exampleName.value = key;
    return;
  }
  stashActiveTemplate();
  const found = templateOptions.value.find(item => item.key === key);
  if (!found) return;
  template.value = cloneTemplate(found.template);
  selectedId.value = "";
  exampleName.value = key;
  activeTemplateKey.value = key;
  activeTemplateName.value = template.value.name;
  snapshot();
};

const handleTemplateSelect = (key: string) => {
  if (key === newTemplateSelectValue) {
    activeTemplateKey.value = templateOptions.value.find(item => item.template.name === activeTemplateName.value)?.key || templateOptions.value[0]?.key || `builtin:${templateExamples[0].name}`;
    openCreateTemplateDialog("blank");
    return;
  }
  useTemplate(key);
};

const changeTemplateDraftPaper = (name: string) => {
  const found = paperPresets.find(item => item.name === name);
  if (!found) return;
  Object.assign(templateDraft, {
    paperName: found.name,
    width: found.width,
    height: found.height,
    marginX: found.marginX,
    marginY: found.marginY,
    gap: found.gap,
    direction: found.direction,
    density: found.density,
    speed: found.speed,
    offsetX: found.offsetX,
    offsetY: found.offsetY,
    mode: found.mode
  });
};

const applyPaperToDraft = (paper: QrLayoutPaper) => {
  const normalized = normalizePaper(paper);
  Object.assign(templateDraft, {
    paperName: normalized.name,
    width: normalized.width,
    height: normalized.height,
    marginX: normalized.marginX,
    marginY: normalized.marginY,
    gap: normalized.gap,
    direction: normalized.direction,
    density: normalized.density,
    speed: normalized.speed,
    offsetX: normalized.offsetX,
    offsetY: normalized.offsetY,
    mode: normalized.mode,
    borderRadius: normalized.borderRadius,
    borderVisible: normalized.borderVisible,
    borderWidth: normalized.borderWidth
  });
};

const syncTemplateDraftFromSource = () => {
  if (templateDraft.source === "current") {
    applyPaperToDraft(template.value.paper);
    return;
  }
  if (templateDraft.source === "example") {
    const found = templateOptions.value.find(item => item.template.name === templateDraft.exampleName);
    if (found) applyPaperToDraft(found.template.paper);
    return;
  }
  changeTemplateDraftPaper(templateDraft.paperName);
};

const openCreateTemplateDialog = (source: TemplateSource, baseTemplate?: QrLayoutTemplate) => {
  const base = baseTemplate || (source === "current" ? template.value : templateExamples[0]);
  templateDraft.source = source;
  templateDraft.exampleName = base.name;
  templateDraft.name = uniqueTemplateName(source === "blank" ? "新模板" : `${base.name}副本`);
  if (source === "blank") {
    changeTemplateDraftPaper(defaultDraftPaper.name);
  } else {
    applyPaperToDraft(base.paper);
  }
  templateDialogVisible.value = true;
};

const buildDraftPaper = (): QrLayoutPaper => ({
  name: templateDraft.paperName === "自定义" ? `${templateDraft.width} x ${templateDraft.height}` : templateDraft.paperName,
  width: templateDraft.width,
  height: templateDraft.height,
  marginX: templateDraft.marginX,
  marginY: templateDraft.marginY,
  gap: templateDraft.gap,
  direction: templateDraft.direction,
  density: templateDraft.density,
  speed: templateDraft.speed,
  offsetX: templateDraft.offsetX,
  offsetY: templateDraft.offsetY,
  mode: templateDraft.mode,
  borderRadius: templateDraft.borderRadius,
  borderVisible: templateDraft.borderVisible,
  borderWidth: templateDraft.borderWidth
});

const saveTemplateDraft = () => {
  if (!templateDraft.name.trim()) {
    ElMessage.warning("请输入模板名");
    return;
  }
  const sourceTemplate =
    templateDraft.source === "current"
      ? template.value
      : templateDraft.source === "example"
        ? templateOptions.value.find(item => item.template.name === templateDraft.exampleName)?.template || createDefaultTemplate()
        : createDefaultTemplate();
  const nextTemplate = cloneTemplate(sourceTemplate);
  nextTemplate.name = uniqueTemplateName(templateDraft.name);
  nextTemplate.paper = buildDraftPaper();
  if (templateDraft.source === "blank") nextTemplate.elements = [];
  customTemplates.value.push(nextTemplate);
  persistCustomTemplates();
  templateDialogVisible.value = false;
  useTemplate(`local:${nextTemplate.name}`);
  ElMessage.success("模板已新增");
};

const selectServerTemplate = (id?: number) => {
  const found = id ? serverTemplates.value.find(item => item.id === id) : serverTemplates.value[0];
  if (!found) return;
  template.value = cloneTemplate(found.template);
  selectedId.value = "";
  activeTemplateKey.value = `server:${found.id}`;
  exampleName.value = activeTemplateKey.value;
  activeTemplateName.value = found.template.name;
  snapshot();
};

const saveTemplateToServer = async (option?: TemplateLibraryOption) => {
  const target = option || activeTemplateOption.value;
  const sourceTemplate = target?.key === activeTemplateKey.value ? template.value : target?.template || template.value;
  const nextTemplate = cloneTemplate(sourceTemplate);
  nextTemplate.name = sourceTemplate.name || activeTemplateName.value || "新模板";
  const response = await createQrLayoutTemplate({
    name: nextTemplate.name,
    templateJson: templateJson(nextTemplate),
    visibility: "private"
  });
  await loadServerTemplates();
  if (target?.key === "local:current") localCurrentTemplate.value = null;
  selectServerTemplate(response.data?.id);
  ElMessage.success("模板已保存到后端");
};

const saveCurrentTemplate = async () => {
  const option = activeTemplateOption.value;
  const activeName = activeTemplateName.value || template.value.name || "新模板";
  const nextTemplate = cloneTemplate({ ...template.value, name: activeName });
  if (option?.source === "server" && option.record?.id && option.editable) {
    await updateQrLayoutTemplate(option.record.id, {
      name: activeName,
      templateJson: templateJson(nextTemplate)
    });
    await loadServerTemplates();
    selectServerTemplate(option.record.id);
    ElMessage.success("模板已保存");
    return;
  }
  await saveTemplateToServer(option);
};

const publishCurrentTemplate = async () => {
  const option = activeTemplateOption.value;
  if (option?.source !== "server" || !option.record?.id || !option.editable) return;
  await publishQrLayoutTemplate(option.record.id);
  await loadServerTemplates();
  selectServerTemplate(option.record.id);
  ElMessage.success("模板已公开");
};

const unpublishCurrentTemplate = async () => {
  const option = activeTemplateOption.value;
  if (option?.source !== "server" || !option.record?.id || !option.editable) return;
  await unpublishQrLayoutTemplate(option.record.id);
  await loadServerTemplates();
  selectServerTemplate(option.record.id);
  ElMessage.success("已取消公开");
};

const copyTemplate = async (item: TemplateLibraryOption) => {
  if (item.source !== "server" || !item.record?.id) {
    openCreateTemplateDialog("example", item.template);
    return;
  }
  const name = uniqueTemplateName(`${item.template.name}_副本`);
  const response = await copyQrLayoutTemplate(item.record.id, { name });
  await loadServerTemplates();
  selectServerTemplate(response.data?.id);
  ElMessage.success("模板已复制");
};

const renameTemplate = async (item: TemplateLibraryOption) => {
  try {
    const result = await ElMessageBox.prompt("请输入新的模板名", "重命名模板", {
      inputValue: item.template.name,
      inputPattern: /\S+/,
      inputErrorMessage: "模板名不能为空"
    });
    if (result.value.trim() === item.template.name) return;
    const newName = uniqueTemplateName(result.value);
    const nextTemplate = cloneTemplate(item.key === activeTemplateKey.value ? template.value : item.template);
    nextTemplate.name = newName;
    if (item.source === "server" && item.record?.id) {
      await updateQrLayoutTemplate(item.record.id, {
        name: newName,
        templateJson: templateJson(nextTemplate)
      });
      await loadServerTemplates();
      selectServerTemplate(item.record.id);
      return;
    }
    if (item.key === "local:current") {
      localCurrentTemplate.value = nextTemplate;
    } else {
      const target = customTemplates.value.find(templateItem => templateItem.name === item.template.name);
      if (!target) return;
      target.name = newName;
      persistCustomTemplates();
    }
    if (item.key === activeTemplateKey.value) {
      template.value.name = newName;
      activeTemplateKey.value = item.key === "local:current" ? item.key : `local:${newName}`;
      exampleName.value = activeTemplateKey.value;
      activeTemplateName.value = newName;
    }
  } catch {
    // 用户取消重命名时不提示。
  }
};

const loadServerTemplates = async () => {
  const response = await getQrLayoutTemplateList({ scope: "all", pageNum: 1, pageSize: 200 });
  const records = response.data?.records || [];
  const details = await Promise.all(
    records.map(async record => {
      if (record.templateJson) return record;
      try {
        return (await getQrLayoutTemplateDetail(record.id)).data;
      } catch {
        return null;
      }
    })
  );
  serverTemplates.value = details
    .filter((item): item is QrLayoutTemplateRecord => Boolean(item))
    .map(parseServerTemplate)
    .filter((item): item is ServerTemplateItem => Boolean(item));
};

const createFirstServerTemplateFromLocal = async () => {
  if (serverTemplates.value.length || !localCurrentTemplate.value) return;
  const firstTemplate = cloneTemplate(localCurrentTemplate.value);
  const response = await createQrLayoutTemplate({
    name: firstTemplate.name || "新模板",
    templateJson: templateJson(firstTemplate),
    visibility: "private"
  });
  await loadServerTemplates();
  localCurrentTemplate.value = null;
  selectServerTemplate(response.data?.id);
  ElMessage.success("本地模板已作为首个后端模板保存");
};

const removeTemplate = async (item: TemplateLibraryOption) => {
  await ElMessageBox.confirm("确认删除该模板？", "提示", { type: "warning" });
  if (item.source === "server" && item.record?.id) {
    await deleteQrLayoutTemplate(item.record.id);
    await loadServerTemplates();
  } else if (item.key === "local:current") {
    localCurrentTemplate.value = null;
  } else {
    customTemplates.value = customTemplates.value.filter(templateItem => templateItem.name !== item.template.name);
    persistCustomTemplates();
  }
  if (activeTemplateKey.value === item.key) useTemplate(templateOptions.value[0]?.key || `builtin:${templateExamples[0].name}`);
};

const triggerImport = () => templateInputRef.value?.click();
const triggerImage = () => imageInputRef.value?.click();

const importTemplate = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    template.value = normalizeTemplate(JSON.parse(await readFileAsText(file)));
    localCurrentTemplate.value = cloneTemplate(template.value);
    selectedId.value = "";
    activeTemplateKey.value = "local:current";
    exampleName.value = activeTemplateKey.value;
    activeTemplateName.value = template.value.name;
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
  sourceDraft.serial = normalizeSerialRule(sourceDraft.serial);
};

const sourceSummary = (source: QrLayoutObjectDataSource) => {
  const typeMap: Record<QrLayoutSourceType, string> = {
    fixed: "固定值",
    manual: "打印输入",
    date: `日期 ${source.dateFormat}${source.dateOffset ? ` 偏移${source.dateOffset}` : ""}`,
    time: `时间 ${source.timeFormat}`,
    serial: `流水号 ${source.serial.start} ${source.serial.direction === "decrement" ? "递减" : "递增"} 公差${source.serial.step}`,
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
  const currentBorder = {
    borderRadius: templateBorderRadius(template.value.paper),
    borderVisible: templateBorderVisible(template.value.paper),
    borderWidth: templateBorderWidth(template.value.paper)
  };
  if (preset) template.value.paper = normalizePaper({ ...preset, ...currentBorder });
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
  fontSize: `${item.fontSize * previewFontScale.value}px`,
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
    fontSize: `${item.sourceText.fontSize * previewFontScale.value}px`,
    fontFamily: item.sourceText.fontFamily,
    fontWeight: item.sourceText.bold ? 700 : 400
  };
};

const renderElement = (item: QrLayoutElement) => resolveElementValue(item, undefined, template.value);

const code128Svg = (content: string) => {
  const data = buildCode128Bars(content);
  const rects = data.bars.map(bar => `<rect x="${bar.x}" y="0" width="${bar.width}" height="48" />`).join("");
  return `<svg viewBox="0 0 ${data.total} 48" preserveAspectRatio="none" style="display:block;width:100%;height:100%;" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
};

const openPrintDialog = (onlyFirst: boolean) => {
  testPrint.value = onlyFirst;
  printVisible.value = true;
};

const showTsplDialog = () => {
  tsplText.value = generateBatchTspl(template.value, false, printQuantity.value);
  tsplVisible.value = true;
};

const copyTspl = async () => {
  await navigator.clipboard.writeText(tsplText.value);
  ElMessage.success("已复制");
};

const downloadTspl = () => {
  downloadText(`${template.value.name}.tspl`, tsplText.value, "text/plain");
};

const openPdfPreview = async (onlyFirst: boolean) => {
  if (printing) {
    ElMessage.warning("PDF正在生成，请稍候");
    return;
  }
  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    ElMessage.warning("浏览器拦截了PDF预览窗口，请允许弹窗后重试");
    return;
  }
  previewWindow.document.write("<!doctype html><title>PDF生成中</title><body style=\"font-family:Arial,sans-serif;padding:24px;\">PDF生成中...</body>");
  printing = true;
  try {
    const pdfBlob = await buildPrintPdf(onlyFirst);
    const safePdfBlob = pdfBlob.type === "application/pdf" ? pdfBlob : new Blob([pdfBlob], { type: "application/pdf" });
    if (printBlobUrl) URL.revokeObjectURL(printBlobUrl);
    printBlobUrl = URL.createObjectURL(safePdfBlob);
    previewWindow.location.href = printBlobUrl;
  } catch (error) {
    previewWindow.close();
    const message = error instanceof Error ? error.message : String(error);
    ElMessage.error(`PDF生成失败：${message}`);
    console.error(error);
  } finally {
    printing = false;
  }
};

const directPrint = async (onlyFirst: boolean) => {
  try {
    const response = await fetch("http://127.0.0.1:17620/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tspl: generateBatchTspl(template.value, onlyFirst, printQuantity.value), template: template.value })
    });
    if (!response.ok) throw new Error("print failed");
    ElMessage.success("已发送到本地打印服务");
  } catch {
    ElMessage.warning("本地打印服务未启动，后续完成服务后可直连打印");
  }
};

const openPrintPreview = async (onlyFirst: boolean) => {
  if (printing) {
    ElMessage.warning("打印预览正在生成，请稍候");
    return;
  }
  printing = true;
  try {
    const pdfBlob = await buildPrintPdf(onlyFirst);
    const safePdfBlob = pdfBlob.type === "application/pdf" ? pdfBlob : new Blob([pdfBlob], { type: "application/pdf" });
    if (printBlobUrl) URL.revokeObjectURL(printBlobUrl);
    printBlobUrl = URL.createObjectURL(safePdfBlob);
    printJS({
      printable: printBlobUrl,
      type: "pdf",
      showModal: true,
      modalMessage: "正在准备打印预览...",
      onError: () => {
        window.open(printBlobUrl, "_blank");
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ElMessage.error(`打印预览生成失败：${message}`);
    console.error(error);
  } finally {
    printing = false;
  }
};

const buildPrintPdf = async (onlyFirst: boolean) => {
  const pages = onlyFirst ? currentPrintPages.value.slice(0, 1) : currentPrintPages.value;
  const paper = template.value.paper;
  const orientation = paper.width > paper.height ? "landscape" : "portrait";
  const pdf = new jsPDF({
    unit: "mm",
    format: [paper.width, paper.height],
    orientation,
    compress: true
  });
  const visibleElements = sortedElements.value.filter(item => item.visible);
  for (let index = 0; index < pages.length; index++) {
    if (index > 0) pdf.addPage([paper.width, paper.height], orientation);
    await renderPdfPage(pdf, paper, visibleElements, pages[index]);
  }
  const arrayBuffer = pdf.output("arraybuffer");
  return new Blob([arrayBuffer], { type: "application/pdf" });
};

const renderPdfPage = async (pdf: jsPDF, paper: QrLayoutTemplate["paper"], elements: QrLayoutElement[], page: ReturnType<typeof buildPrintPages>[number]) => {
  pdf.setFillColor(255, 255, 255);
  const radius = templateBorderRadius(paper);
  if (radius > 0) {
    pdf.roundedRect(0, 0, paper.width, paper.height, radius, radius, "F");
  } else {
    pdf.rect(0, 0, paper.width, paper.height, "F");
  }
  for (const item of elements) {
    const value = resolveElementValue(item, page, template.value);
    if (item.type === "text") {
      drawPdfText(pdf, item, value);
    }
    if (item.type === "qr") {
      const src = await renderQr(value, qrPrintSize(item), item.errorCorrectionLevel);
      pdf.addImage(src, "PNG", item.x, item.y, item.width, item.height, undefined, "FAST", item.rotate);
      drawPdfSourceText(pdf, item, value);
    }
    if (item.type === "code128") {
      drawPdfCode128(pdf, item, value);
      drawPdfSourceText(pdf, item, value);
    }
    if (item.type === "image") {
      pdf.addImage(item.src, imageFormat(item.src), item.x, item.y, item.width, item.height, undefined, "FAST", item.rotate);
    }
    if (item.type === "line") {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(item.strokeWidth);
      pdf.line(item.x, item.y + item.strokeWidth / 2, item.x + item.width, item.y + item.strokeWidth / 2);
    }
    if (item.type === "rect") {
      pdf.setDrawColor(0, 0, 0);
      pdf.setFillColor(0, 0, 0);
      pdf.setLineWidth(item.strokeWidth);
      pdf.rect(item.x, item.y, item.width, item.height, item.fill ? "F" : "S");
    }
  }
  drawPdfPaperBorder(pdf, paper);
};

const drawPdfPaperBorder = (pdf: jsPDF, paper: QrLayoutTemplate["paper"]) => {
  if (!templateBorderVisible(paper)) return;
  const width = templateBorderWidth(paper);
  const radius = templateBorderRadius(paper);
  const offset = width / 2;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(width);
  if (radius > 0) {
    pdf.roundedRect(offset, offset, paper.width - width, paper.height - width, Math.max(radius - offset, 0), Math.max(radius - offset, 0), "S");
    return;
  }
  pdf.rect(offset, offset, paper.width - width, paper.height - width, "S");
};

const drawPdfText = (pdf: jsPDF, item: QrLayoutElement, value: string) => {
  drawPdfTextBlock(pdf, {
    x: item.x,
    y: item.y,
    width: item.width,
    height: item.height,
    text: value,
    fontSize: item.fontSize,
    fontFamily: item.fontFamily,
    bold: item.bold,
    align: item.align,
    lineHeight: item.lineHeight,
    rotate: item.rotate
  });
};

const drawPdfSourceText = (pdf: jsPDF, item: Extract<QrLayoutElement, { type: "qr" | "code128" }>, value: string) => {
  if (!item.sourceText.visible) return;
  const point = sourceTextPoint(item);
  drawPdfTextBlock(pdf, {
    x: point.x,
    y: point.y,
    width: point.width,
    height: point.height,
    text: value,
    fontSize: item.sourceText.fontSize,
    fontFamily: item.sourceText.fontFamily,
    bold: item.sourceText.bold,
    align: "center",
    lineHeight: 1.15,
    rotate: 0
  });
};

const drawPdfTextBlock = (
  pdf: jsPDF,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    bold: boolean;
    align: "left" | "center" | "right";
    lineHeight: number;
    rotate: number;
  }
) => {
  const lineHeightMm = Math.max((options.fontSize * options.lineHeight) / cssPxPerMm, 1);
  const boxWidthPx = options.width * cssPxPerMm;
  const boxHeightPx = options.height * cssPxPerMm;
  const verticalPaddingPx = Math.min(Math.max(options.fontSize * 0.16, 1), Math.max(boxHeightPx / 4, 1));
  const contentHeightPx = Math.max(1, boxHeightPx - verticalPaddingPx * 2);
  const maxLines = Math.max(1, Math.floor(contentHeightPx / (lineHeightMm * cssPxPerMm)));
  const canvas = document.createElement("canvas");
  const widthPx = Math.max(1, Math.ceil(boxWidthPx * pdfTextScale));
  const heightPx = Math.max(1, Math.ceil(boxHeightPx * pdfTextScale));
  canvas.width = widthPx;
  canvas.height = heightPx;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.scale(pdfTextScale, pdfTextScale);
  context.fillStyle = "#000000";
  context.textBaseline = "top";
  context.font = `${options.bold ? "700" : "400"} ${options.fontSize}px ${options.fontFamily}`;
  const lines = String(options.text || "")
    .split(/\r?\n/)
    .flatMap(line => wrapCanvasText(context, line || " ", boxWidthPx))
    .slice(0, maxLines);
  const textX = options.align === "center" ? boxWidthPx / 2 : options.align === "right" ? boxWidthPx : 0;
  lines.forEach((line, index) => {
    context.textAlign = options.align;
    context.fillText(line, textX, verticalPaddingPx + index * lineHeightMm * cssPxPerMm);
  });
  pdf.addImage(canvas, "PNG", options.x, options.y, options.width, options.height, undefined, "FAST", options.rotate);
};

const drawPdfCode128 = (pdf: jsPDF, item: Extract<QrLayoutElement, { type: "code128" }>, value: string) => {
  const data = buildCode128Bars(value);
  const unitWidth = item.width / data.total;
  pdf.setFillColor(0, 0, 0);
  data.bars.forEach(bar => {
    pdf.rect(item.x + bar.x * unitWidth, item.y, Math.max(bar.width * unitWidth, 0.05), item.height, "F");
  });
};

const wrapCanvasText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const lines: string[] = [];
  let line = "";
  Array.from(text).forEach(char => {
    const nextLine = `${line}${char}`;
    if (line && context.measureText(nextLine).width > maxWidth) {
      lines.push(line);
      line = char;
      return;
    }
    line = nextLine;
  });
  lines.push(line || " ");
  return lines;
};

const qrPrintSize = (item: Extract<QrLayoutElement, { type: "qr" }>) => {
  return Math.max(512, Math.ceil((Math.max(item.width, item.height) / 25.4) * 600));
};

const imageFormat = (src: string) => {
  if (/^data:image\/jpe?g/i.test(src)) return "JPEG";
  if (/^data:image\/webp/i.test(src)) return "WEBP";
  return "PNG";
};

const buildPrintHtml = async (pages: ReturnType<typeof buildPrintPages>) => {
  const paper = template.value.paper;
  const borderStyle = templateBorderVisible(paper) ? `border:${templateBorderWidth(paper)}mm solid #000;` : "border:0;";
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
.print-page { position: relative; width: ${paper.width}mm; height: ${paper.height}mm; margin: 8px auto; overflow: hidden; background: #fff; border-radius: ${templateBorderRadius(paper)}mm; ${borderStyle} page-break-after: always; }
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
  const common = `position:absolute;left:${item.x}mm;top:${item.y}mm;width:${item.width}mm;height:${item.height}mm;z-index:${item.zIndex};overflow:visible;box-sizing:border-box;transform:rotate(${item.rotate}deg);transform-origin:center center;`;
  const value = resolveElementValue(item, page, template.value);
  if (item.type === "text") {
    const style = `${common}font-weight:${item.bold ? 700 : 400};font-size:${item.fontSize}px;font-family:${cssFontFamily(item.fontFamily)};line-height:${item.lineHeight};text-align:${item.align};white-space:pre-wrap;word-break:break-all;overflow:hidden;`;
    return `<div class="item text" style="${style}">${escapeHtml(value)}</div>`;
  }
  if (item.type === "qr") {
    const src = await renderQr(value, 256, item.errorCorrectionLevel);
    return `<div class="item" style="${common}"><img src="${src}" style="display:block;width:100%;height:100%;object-fit:contain;" />${sourcePrintHtml(item, value)}</div>`;
  }
  if (item.type === "code128") return `<div class="item" style="${common}"><div style="width:100%;height:100%;">${code128Svg(value)}</div>${sourcePrintHtml(item, value)}</div>`;
  if (item.type === "image") return `<div class="item" style="${common}"><img src="${item.src}" style="display:block;width:100%;height:100%;object-fit:${item.fit};" /></div>`;
  if (item.type === "line") return `<div class="item" style="${common}border-top:${item.strokeWidth}mm solid #000;"></div>`;
  return `<div class="item" style="${common}"><div class="rect" style="width:100%;height:100%;box-sizing:border-box;border:${item.strokeWidth}mm solid #000;${item.fill ? "background:#000;" : ""}"></div></div>`;
};

const sourcePrintHtml = (item: Extract<QrLayoutElement, { type: "qr" | "code128" }>, value: string) => {
  if (!item.sourceText.visible) return "";
  const point = sourceTextPoint(item);
  const style = `position:absolute;left:${point.x - item.x}mm;top:${point.y - item.y}mm;width:${point.width}mm;min-height:${point.height}mm;font-weight:${item.sourceText.bold ? 700 : 400};font-size:${item.sourceText.fontSize}px;font-family:${cssFontFamily(item.sourceText.fontFamily)};line-height:1.15;text-align:center;white-space:pre-wrap;word-break:break-all;box-sizing:border-box;`;
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
const cssFontFamily = (value: string) => value.split(",").map(item => `"${item.trim().replace(/"/g, '\\"')}"`).join(",");
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
          qrCache[item.id] = await renderQr(resolveElementValue(item, undefined, template.value), 256, item.errorCorrectionLevel);
        })
    );
    refreshTarget();
  },
  { deep: true, immediate: true }
);

watch(
  template,
  () => {
    stashActiveTemplate();
    persistTemplate();
  },
  { deep: true }
);

onMounted(async () => {
  loadCustomTemplates();
  loadSavedTemplates();
  loadLocalTemplate();
  try {
    await loadServerTemplates();
    await createFirstServerTemplateFromLocal();
  } catch (error) {
    console.error(error);
    ElMessage.warning("后端模板加载失败，本地模板已保留");
  }
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
  grid-template-columns: 300px minmax(0, 1fr) 380px;
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
  gap: 10px;
}

.template-card {
  display: grid;
  gap: 8px;
  padding: 10px;
  color: #1f2937;
  text-align: left;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.template-card:hover {
  background: #ffffff;
  border-color: #cbd5e1;
}

.template-card.active {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #93c5fd;
  box-shadow: inset 3px 0 0 #2563eb;
}

.template-card__main {
  display: grid;
  gap: 6px;
  min-width: 0;

  strong {
    line-height: 1.35;
    word-break: break-all;
  }
}

.template-card__actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, auto));
  flex-wrap: wrap;
  gap: 4px 10px;
  justify-content: flex-start;

  :deep(.el-button) {
    height: 22px;
    padding: 0;
    margin: 0;
  }
}

.template-card__meta {
  font-size: 12px;
  color: #64748b;
}

.template-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.template-card__tag {
  padding: 1px 6px;
  font-size: 12px;
  line-height: 18px;
  color: #475569;
  background: #e2e8f0;
  border-radius: 4px;
}

.template-card__tag.is-public {
  color: #047857;
  background: #d1fae5;
}

.template-card__tag.is-private {
  color: #1d4ed8;
  background: #dbeafe;
}

.template-card__tag.is-local {
  color: #b45309;
  background: #fef3c7;
}

.template-card__tag.is-builtin {
  color: #475569;
  background: #e2e8f0;
}

.template-card__owner {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  color: #64748b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-add-card {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  height: 54px;
  color: #2563eb;
  cursor: pointer;
  background: #eff6ff;
  border: 1px dashed #60a5fa;
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

.print-quantity-row {
  display: grid;
  grid-template-columns: 160px 180px;
  gap: 6px;
  align-items: center;
  margin: 10px 0;
}

.print-source-row {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 6px;
  align-items: center;
}

.template-create {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;
}

.template-create__form {
  min-width: 0;
}

.template-preview-panel {
  display: grid;
  gap: 12px;
  align-content: start;
  padding: 14px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.template-preview-title {
  font-size: 14px;
  font-weight: 600;
}

.template-preview-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 230px;
  overflow: hidden;
  background:
    linear-gradient(to right, rgb(17 24 39 / 6%) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(17 24 39 / 6%) 1px, transparent 1px),
    #ffffff;
  background-size: 12px 12px;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
}

.template-preview-paper {
  position: relative;
  background: #ffffff;
  box-shadow: 0 10px 24px rgb(15 23 42 / 14%);
}

.template-preview-margin {
  position: absolute;
  background: rgb(37 99 235 / 8%);
  border: 1px dashed #60a5fa;
}

.template-preview-size {
  position: absolute;
  padding: 2px 6px;
  font-size: 12px;
  color: #344054;
  background: rgb(255 255 255 / 88%);
  border: 1px solid #d0d5dd;
  border-radius: 4px;
}

.template-preview-size--top {
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
}

.template-preview-size--left {
  top: 50%;
  left: 6px;
  transform: translateY(-50%) rotate(-90deg);
}

.template-preview-meta {
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: #475467;
}
</style>
