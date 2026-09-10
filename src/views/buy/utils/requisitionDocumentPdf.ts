import {
  DocumentPdfBuilder,
  PdfService,
  type DataAdapter,
  type TemplateConfig,
  type UnifiedDocumentModel
} from "@/modules/document-pdf";

interface RequisitionDocument {
  requisitionNum?: string;
  requisitionDate?: string;
  remark?: string;
  items?: Record<string, any>[];
}

type RequisitionType = "raw" | "assist";

class RequisitionDocumentAdapter implements DataAdapter<RequisitionDocument> {
  constructor(private readonly type: RequisitionType) {}

  adapt(source: RequisitionDocument): UnifiedDocumentModel {
    const items = (source.items || []).map((item, index) => ({
      ...item,
      sequence: index + 1,
      materialQuantity: this.type === "raw"
        ? `${item.requisitionNumber ?? ""}${item.useType === "roll" ? "卷" : item.useType === "sheet" ? "张" : ""}`
        : undefined
    }));
    return {
      documentType: `${this.type}-requisition-order`,
      documentTitle: "采购申购单",
      headerData: {
        requisitionNum: source.requisitionNum,
        requisitionDate: source.requisitionDate,
        department: "业务部"
      },
      detailData: items,
      footerData: { remark: source.remark, approvalOpinion: "" },
      printTime: new Date()
    };
  }
}

const baseTemplate: Omit<TemplateConfig, "detailTable"> = {
  pageSize: { width: 680.32, height: 396.85 },
  pageOrientation: "landscape",
  pageMargins: [18, 18, 18, 22],
  basicInfo: {
    columns: 3,
    fields: [
      { label: "请购单号", field: "requisitionNum" },
      { label: "申购部门", field: "department" },
      { label: "请购日期", field: "requisitionDate", format: { type: "date", pattern: "YYYY-MM-DD" } }
    ]
  },
  approval: { columns: 2, fields: [{ label: "审批意见", field: "approvalOpinion", emptyText: "" }] },
  remarks: { fields: [{ label: "申购说明", field: "remark", emptyText: "", overflow: "wrap" }] },
  footer: { showPageNumber: true },
  defaultStyle: { fontSize: 9 },
  styles: { documentTitle: { fontSize: 18, bold: true, alignment: "center", margin: [0, 0, 0, 8] } }
};

const tableLayout = {
  hLineWidth: () => 0.7,
  vLineWidth: () => 0.7,
  hLineColor: () => "#888888",
  vLineColor: () => "#888888",
  paddingTop: () => 4,
  paddingBottom: () => 4,
  paddingLeft: () => 3,
  paddingRight: () => 3
};

const rawTemplate: TemplateConfig = {
  ...baseTemplate,
  detailTable: {
    headerRows: 1,
    layout: tableLayout,
    columns: [
      { label: "序号", field: "sequence", width: 26, alignment: "center" },
      { label: "订单号", field: "custOrderNum", width: 72 },
      { label: "物料编号", field: "materNum", width: 60 },
      { label: "物料名称", field: "materName", width: 70, overflow: "wrap" },
      { label: "原材料编号", field: "rawNum", width: 65 },
      { label: "规格", field: "rawSpecs", width: 94, overflow: "wrap" },
      { label: "生产数", field: "productionNumber", width: 44, alignment: "right" },
      { label: "材料数", field: "materialQuantity", width: 48, alignment: "right" },
      { label: "请购重量", field: "requisitionWeight", width: 56, alignment: "right" },
      { label: "备注", field: "remark", width: 70, overflow: "wrap" }
    ]
  }
};

const assistTemplate: TemplateConfig = {
  ...baseTemplate,
  detailTable: {
    headerRows: 1,
    layout: tableLayout,
    columns: [
      { label: "序号", field: "sequence", width: 32, alignment: "center" },
      { label: "辅材编码", field: "assistCode", width: 90 },
      { label: "名称", field: "assistName", width: 90 },
      { label: "规格", field: "assistSpec", width: 130, overflow: "wrap" },
      { label: "请购数量", field: "requisitionQty", width: 70, alignment: "right" },
      { label: "单位", field: "unit", width: 50, alignment: "center" },
      { label: "状态", field: "status", width: 70, alignment: "center" }
    ]
  }
};

export const exportRequisitionPdf = async (type: RequisitionType, document: RequisitionDocument) => {
  const model = await new RequisitionDocumentAdapter(type).adapt(document);
  const definition = new DocumentPdfBuilder().build(model, type === "raw" ? rawTemplate : assistTemplate);
  await new PdfService().preview(definition);
};
