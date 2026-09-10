# 通用业务单据 PDF 使用说明

本模块使用 `pdfmake` 在浏览器中生成 PDF。后端只需返回业务数据、模板配置和图片资源，不负责渲染 PDF。

核心模块不识别采购单、请购单等具体业务类型。新增单据时，只增加对应的数据适配器和模板配置，不修改本目录中的公共代码。

## 目录说明

```text
document-pdf/
├── AssetService.ts          # 图片、二维码、Code128 转换为 DataURL
├── DocumentPdfBuilder.ts    # 统一模型和模板配置转 documentDefinition
├── PdfService.ts            # 字体注册、Blob、预览、下载和打印
├── formatters.ts            # 空值、日期、数量、金额和字段路径处理
├── index.ts                 # 统一导出入口
└── types.ts                 # 模型、模板、字段和适配器类型
```

中文字体文件位于：

```text
public/fonts/NotoSansSC-Regular.ttf
public/fonts/NotoSansSC-Bold.ttf
```

`PdfService` 会在首次生成 PDF 时加载并注册字体，普通文本使用 Regular，粗体文本使用 Bold。

## 基本调用流程

```text
后端业务数据
    ↓
DataAdapter
    ↓
UnifiedDocumentModel
    +
TemplateConfig
    ↓
DocumentPdfBuilder
    ↓
documentDefinition
    ↓
PdfService
    ↓
Blob / 预览 / 下载 / 打印
```

## 最小使用示例

```ts
import {
  AssetService,
  DocumentPdfBuilder,
  PdfService,
  type TemplateConfig,
  type UnifiedDocumentModel
} from "@/modules/document-pdf";

const model: UnifiedDocumentModel = {
  documentType: "example-document",
  documentTitle: "示例业务单据",
  headerData: {
    documentNumber: "DOC-001",
    documentDate: "2026-08-31",
    organizationName: "示例组织"
  },
  detailData: [
    {
      sequence: 1,
      itemName: "物料 A",
      quantity: 10,
      unitPrice: 12.5,
      amount: 125
    }
  ],
  summaryData: {
    totalAmount: 125
  },
  footerData: {
    remark: "示例备注"
  },
  maker: "张三",
  printTime: new Date()
};

const templateConfig: TemplateConfig = {
  pageSize: "A4",
  pageOrientation: "portrait",
  pageMargins: [32, 52, 32, 52],
  basicInfo: {
    columns: 2,
    fields: [
      { label: "单据编号", field: "documentNumber" },
      { label: "单据日期", field: "documentDate", format: { type: "date", pattern: "YYYY-MM-DD" } },
      { label: "组织", field: "organizationName", emptyText: "-" }
    ]
  },
  detailTable: {
    headerRows: 1,
    columns: [
      { label: "序号", field: "sequence", width: 36, alignment: "center" },
      { label: "名称", field: "itemName", width: "*", overflow: "wrap" },
      { label: "数量", field: "quantity", width: 60, alignment: "right", format: { type: "number", digits: 0 } },
      { label: "单价", field: "unitPrice", width: 70, alignment: "right", format: { type: "amount", digits: 2 } },
      { label: "金额", field: "amount", width: 80, alignment: "right", format: { type: "amount", digits: 2 } }
    ]
  },
  summary: {
    columns: 1,
    fields: [{ label: "合计金额", field: "totalAmount", alignment: "right", format: { type: "amount", digits: 2, currency: "¥" } }]
  },
  remarks: {
    fields: [{ label: "备注", field: "remark", overflow: "wrap" }]
  },
  footer: {
    showPageNumber: true,
    showMaker: true,
    showPrintTime: true
  }
};

const documentDefinition = new DocumentPdfBuilder().build(model, templateConfig);
const pdfService = new PdfService();

await pdfService.preview(documentDefinition);
```

## 使用 DataAdapter 适配业务数据

业务接口的数据结构不需要与统一模型一致。每种单据实现自己的 `DataAdapter` 即可。

```ts
import type { DataAdapter, UnifiedDocumentModel } from "@/modules/document-pdf";

interface ApiDocumentResponse {
  type: string;
  title: string;
  header: Record<string, unknown>;
  items: Record<string, unknown>[];
  summary?: Record<string, unknown>;
  footer?: Record<string, unknown>;
  creatorName?: string;
}

export class ExampleDocumentAdapter implements DataAdapter<ApiDocumentResponse> {
  adapt(source: ApiDocumentResponse): UnifiedDocumentModel {
    return {
      documentType: source.type,
      documentTitle: source.title,
      headerData: source.header,
      detailData: source.items,
      summaryData: source.summary,
      footerData: source.footer,
      maker: source.creatorName,
      printTime: new Date()
    };
  }
}
```

调用方式：

```ts
const model = await new ExampleDocumentAdapter().adapt(apiResponse);
const definition = new DocumentPdfBuilder().build(model, templateConfig);
await new PdfService().preview(definition);
```

## 模板配置

### 页面配置

```ts
const templateConfig: TemplateConfig = {
  pageSize: "A4",
  pageOrientation: "landscape",
  pageMargins: [30, 50, 30, 45],
  detailTable: {
    columns: []
  }
};
```

- `pageSize`：页面尺寸，例如 `A4`、`A5`。
- `pageOrientation`：`portrait` 纵向，`landscape` 横向。
- `pageMargins`：单值、横纵边距或 `[左, 上, 右, 下]`。
- `defaultStyle`：pdfmake 默认样式。
- `styles`：自定义 pdfmake 样式字典。

### 基础信息区域

`basicInfo.fields` 从 `headerData` 取值。

```ts
basicInfo: {
  columns: 3,
  fields: [
    { label: "单号", field: "document.number" },
    { label: "日期", field: "document.date", format: { type: "date" } },
    { label: "联系人", field: "contact.name", emptyText: "未填写" }
  ]
}
```

字段支持点路径，例如 `contact.name`。

### 明细表格

`detailTable.columns` 从 `detailData` 的每一行取值。

```ts
detailTable: {
  headerRows: 1,
  dontBreakRows: false,
  keepWithHeaderRows: 1,
  layout: "lightHorizontalLines",
  columns: [
    { label: "名称", field: "name", width: "*" },
    { label: "规格", field: "specification", width: 100 },
    { label: "数量", field: "quantity", width: 60, alignment: "right", format: { type: "number", digits: 2 } }
  ]
}
```

- `headerRows`：重复表头行数，通常设置为 `1`。
- `dontBreakRows`：是否禁止单行跨页。
- `width`：数字、`auto` 或 `*`。
- `alignment`：`left`、`center`、`right`、`justify`。
- `overflow: "wrap"`：自动换行。
- `overflow: "truncate"` 与 `maxLength`：超长文本截断。

### 汇总、审批和备注

- `summary.fields` 从 `summaryData` 取值。
- `approval.fields` 从 `footerData` 取值。
- `remarks.fields` 从 `footerData` 取值。

```ts
summary: {
  fields: [{ label: "总金额", field: "totalAmount", format: { type: "amount", digits: 2 } }]
},
approval: {
  fields: [
    { label: "审核人", field: "approver" },
    { label: "审核意见", field: "approvalRemark", overflow: "wrap" }
  ]
},
remarks: {
  fields: [{ label: "备注", field: "remark", overflow: "wrap" }]
}
```

### 页眉和页脚

```ts
header: {
  text: "内部业务单据",
  margin: [32, 16, 32, 0]
},
footer: {
  showPageNumber: true,
  showMaker: true,
  showPrintTime: true,
  margin: [32, 6, 32, 0]
}
```

页码格式为 `第 currentPage / pageCount 页`。

## 字段格式化

### 数量

```ts
{ label: "数量", field: "quantity", format: { type: "number", digits: 3, useGrouping: true } }
```

### 金额

```ts
{ label: "金额", field: "amount", format: { type: "amount", digits: 2, currency: "¥" } }
```

### 日期

日期格式使用 dayjs 格式：

```ts
{ label: "日期", field: "createdAt", format: { type: "date", pattern: "YYYY-MM-DD HH:mm:ss" } }
```

### 空值

```ts
{ label: "备注", field: "remark", emptyText: "无" }
```

未配置 `emptyText` 时默认显示 `-`。

### 长文本

自动换行：

```ts
{ label: "说明", field: "description", overflow: "wrap" }
```

按字符数截断：

```ts
{ label: "说明", field: "description", overflow: "truncate", maxLength: 30 }
```

## 图片、印章、二维码和条码

所有资源必须先转换成 DataURL，再放入 `model.assets`。

### 网络图片或后端图片接口

```ts
model.assets = await AssetService.normalize({
  logo: "/api/assets/logo/1",
  seal: "/api/assets/seal/2"
});
```

如果图片接口需要认证头：

```ts
const seal = await AssetService.urlToDataUrl("/api/assets/seal/2", {
  headers: { Authorization: token }
});

model.assets = { seal };
```

### Blob 或 File

```ts
const dataUrl = await AssetService.fileToDataUrl(file);
model.assets = { attachment: dataUrl };
```

### 二维码

```ts
const qrCode = await AssetService.qrCode("https://example.com/document/DOC-001", 256);
model.assets = { qrCode };
```

### Code128 条码

```ts
const barcode = AssetService.code128("DOC-001", {
  width: 2,
  height: 60,
  displayValue: true
});

model.assets = { barcode };
```

### 在模板中放置资源

```ts
assets: [
  { assetKey: "logo", width: 80, alignment: "left" },
  { assetKey: "qrCode", width: 70, height: 70, alignment: "center" },
  { assetKey: "seal", width: 90, alignment: "right" }
]
```

也可以将资源配置在 `header.assets`、`footer.assets`、`basicInfo.assets`、`summary.assets`、`approval.assets` 或 `remarks.assets` 中。

## 预览、下载和打印

```ts
const pdfService = new PdfService();
const definition = new DocumentPdfBuilder().build(model, templateConfig);
```

### 获取 Blob

```ts
const blob = await pdfService.getBlob(definition);
```

### 浏览器预览

```ts
await pdfService.preview(definition);
```

内部执行：

```ts
pdfMake.createPdf(documentDefinition).getBlob(...);
URL.createObjectURL(blob);
window.open(blobUrl);
```

### 下载

```ts
await pdfService.download(definition, "业务单据-DOC-001.pdf");
```

### 打印

```ts
await pdfService.print(definition);
```

预览和打印必须由用户点击事件触发，否则浏览器可能阻止新窗口。

```ts
const handlePrint = async () => {
  const definition = new DocumentPdfBuilder().build(model, templateConfig);
  await new PdfService().print(definition);
};
```

## 完整的资源处理调用

```ts
const adapter = new ExampleDocumentAdapter();
const model = await adapter.adapt(apiResponse);

model.assets = await AssetService.normalize({
  logo: "/api/assets/logo/1",
  seal: "/api/assets/seal/2",
  qrCode: AssetService.qrCode(String(model.headerData.documentNumber)),
  barcode: AssetService.code128(String(model.headerData.documentNumber))
});

const definition = new DocumentPdfBuilder().build(model, templateConfig);
await new PdfService().preview(definition);
```

## 新增单据类型

新增单据时按以下步骤处理：

1. 在具体业务模块中创建该单据的数据适配器。
2. 创建该单据的 `TemplateConfig`。
3. 调用后端接口取得主数据、明细和关联信息。
4. 使用 `AssetService` 处理需要插入 PDF 的资源。
5. 使用 `DocumentPdfBuilder` 生成 `documentDefinition`。
6. 使用 `PdfService` 预览、下载或打印。

推荐业务目录：

```text
src/views/业务模块/单据页面/
├── pdf/
│   ├── adapter.ts       # 当前单据的数据适配器
│   └── template.ts      # 当前单据的打印模板
├── index.vue
└── README.md
```

禁止在 `src/modules/document-pdf` 中增加具体单据名称、具体业务字段或业务判断。

## 注意事项

- 图片接口必须允许前端访问；跨域资源需要后端配置 CORS。
- 带登录认证的图片建议由业务代码请求 Blob 后调用 `fileToDataUrl`。
- 字体首次加载会产生一次网络请求，后续由浏览器缓存。
- 大量高分辨率图片会明显增加 PDF 生成时间和文件体积。
- 明细表会自动分页，`headerRows` 控制每页重复的表头行数。
- 中文文本默认自动换行，行高根据内容动态计算。
- 模板配置可由前端静态文件提供，也可以由后端以 JSON 形式返回。
