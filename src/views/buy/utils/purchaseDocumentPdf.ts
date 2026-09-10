import http from "@/api";
import {
  DocumentPdfBuilder,
  PdfService,
  type DataAdapter,
  type TemplateConfig,
  type UnifiedDocumentModel
} from "@/modules/document-pdf";

export interface PurchaseDocumentProfile {
  companyName: string;
  address: string;
  phone: string;
  contact: string;
}

interface PurchaseDocument {
  purchaseNum?: string;
  purchaseDate?: string;
  supName?: string;
  supplierAddress?: string;
  supplierContactName?: string;
  supplierContactPhone?: string;
  totalAmount?: number;
  remark?: string;
  items?: Record<string, any>[];
}

type PurchaseType = "raw" | "assist";

const getProfile = () => http.get<PurchaseDocumentProfile>("/buy/purchase-document/profile", {});
const unwrap = <T>(response: any): T => (response?.data?.data ?? response?.data ?? response) as T;
const amount = (quantity: unknown, unitPrice: unknown) => Number(quantity || 0) * Number(unitPrice || 0);

class PurchaseDocumentAdapter implements DataAdapter<PurchaseDocument> {
  constructor(private readonly type: PurchaseType, private readonly profile: PurchaseDocumentProfile) {}

  adapt(source: PurchaseDocument): UnifiedDocumentModel {
    const totalWeight = (source.items || []).reduce((total, item) => total + Number(item.purchaseWeight || 0), 0);
    const items = (source.items || []).map((item, index) => ({
      ...item,
      sequence: index + 1,
      sheetCount: item.useType === "roll" ? "" : item.purchaseNumber,
      lineAmount: amount(this.type === "assist" ? item.purchaseQty : item.purchaseWeight, item.unitPrice)
    }));
    return {
      documentType: `${this.type}-purchase-order`,
      documentTitle: this.profile.companyName,
      headerData: {
        purchaseNum: source.purchaseNum,
        purchaseDate: source.purchaseDate,
        supplierName: source.supName,
        supplierAddress: source.supplierAddress,
        supplierContactName: source.supplierContactName,
        supplierContactPhone: source.supplierContactPhone
      },
      detailData: items,
      summaryData: { totalWeight, totalAmount: source.totalAmount },
      footerData: {
        notice: this.type === "raw"
          ? "\n1. 每种规格要用包装带打好，并且上面注明板材尺寸及型号\n2. 以上板料剪成规格材料，单面贴膜，包好以防刮花"
          : undefined,
        remark: source.remark
      },
      printTime: new Date()
    };
  }
}

const baseTemplate: Omit<TemplateConfig, "detailTable"> = {
  pageSize: { width: 680.32, height: 396.85 },
  pageOrientation: "landscape",
  pageMargins: [18, 18, 18, 22],
  title: { style: "companyTitle" },
  basicInfo: {
    text: "采购单",
    style: "purchaseTitle",
    columns: 3,
    fields: [
      { label: "采购单号", field: "purchaseNum" },
      { label: "采购日期", field: "purchaseDate", format: { type: "date", pattern: "YYYY-MM-DD" } },
      { label: "供应商", field: "supplierName" },
      { label: "供应商地址", field: "supplierAddress", emptyText: "" },
      { label: "联系人", field: "supplierContactName", emptyText: "" },
      { label: "联系方式", field: "supplierContactPhone", emptyText: "" }
    ]
  },
  summary: {
    columns: 1,
    fields: [{ label: "合计金额（含税13%）", field: "totalAmount", alignment: "right", format: { type: "amount", digits: 2, currency: "¥" } }]
  },
  remarks: { fields: [{ label: "备注", field: "remark", overflow: "truncate", maxLength: 80, noWrap: true, style: "remarkText" }] },
  footer: { showPageNumber: true },
  defaultStyle: { fontSize: 9 },
  styles: {
    companyTitle: { fontSize: 16, bold: true, alignment: "center", margin: [0, 0, 0, 2] },
    purchaseTitle: { fontSize: 12, bold: true, alignment: "center", margin: [0, 0, 0, 5] },
    noticeText: { lineHeight: 1.5 },
    remarkText: { lineHeight: 1.5 }
  }
};

const rawTemplate: TemplateConfig = {
  ...baseTemplate,
  summary: {
    columns: 2,
    margin: [0, 0, 47, 10],
    fields: [
      { label: "总重量", field: "totalWeight", alignment: "right", format: { type: "number", digits: 2 } },
      ...baseTemplate.summary!.fields!
    ]
  },
  approval: { fields: [{ label: "注意", field: "notice", overflow: "wrap", style: "noticeText" }] },
  detailTable: {
    headerRows: 1,
    layout: { hLineWidth: () => 0.7, vLineWidth: () => 0, hLineColor: () => "#888888", paddingTop: () => 5, paddingBottom: () => 5, paddingLeft: () => 4, paddingRight: () => 4 },
    columns: [
      { label: "序号", field: "sequence", width: 24, alignment: "center" },
      { label: "产品编码", field: "rawNum", width: 85 },
      { label: "产品名称", field: "rawName", width: 80, overflow: "wrap" },
      { label: "产品型号", field: "rawSpecs", width: 78, overflow: "wrap" },
      { label: "张数", field: "sheetCount", width: 28, alignment: "right", emptyText: "" },
      { label: "采购重量(kg)", field: "purchaseWeight", width: 60, alignment: "right", format: { type: "number", digits: 2 } },
      { label: "单价", field: "unitPrice", width: 38, alignment: "right", format: { type: "amount", digits: 2 } },
      { label: "金额", field: "lineAmount", width: 72, alignment: "right", format: { type: "amount", digits: 2 } },
      { label: "备注", field: "remark", width: 60, overflow: "wrap" }
    ]
  }
};

const assistTemplate: TemplateConfig = {
  ...baseTemplate,
  summary: { ...baseTemplate.summary!, margin: [0, 0, 47, 10] },
  detailTable: {
    headerRows: 1,
    layout: { hLineWidth: () => 0.7, vLineWidth: () => 0, hLineColor: () => "#888888", paddingTop: () => 5, paddingBottom: () => 5, paddingLeft: () => 4, paddingRight: () => 4 },
    columns: [
      { label: "物料编号", field: "assistCode", width: 90 },
      { label: "物料名称", field: "assistName", width: 105 },
      { label: "规格", field: "assistSpec", width: 120, overflow: "wrap" },
      { label: "单价", field: "unitPrice", width: 50, alignment: "right", format: { type: "amount", digits: 4 } },
      { label: "数量", field: "purchaseQty", width: 50, alignment: "right", format: { type: "number", digits: 2 } },
      { label: "金额", field: "lineAmount", width: 70, alignment: "right", format: { type: "amount", digits: 2 } },
      { label: "备注", field: "remark", width: 56, overflow: "wrap" }
    ]
  }
};

export const buildPurchasePdfDefinition = async (
  type: PurchaseType,
  document: PurchaseDocument,
  profile: PurchaseDocumentProfile
) => {
  const model = await new PurchaseDocumentAdapter(type, profile).adapt(document);
  return new DocumentPdfBuilder().build(model, type === "raw" ? rawTemplate : assistTemplate);
};

export const exportPurchasePdf = async (type: PurchaseType, document: PurchaseDocument) => {
  const profile = unwrap<PurchaseDocumentProfile>(await getProfile());
  const definition = await buildPurchasePdfDefinition(type, document, profile);
  await new PdfService().preview(definition);
};
