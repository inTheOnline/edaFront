export type QuickRequisitionMode = "material" | "order";

export interface QuickRequisitionSource {
  orderItemId?: number;
  materId: number;
  productionNumber: number | null;
  lossRate?: number;
  forceRepeat?: boolean;
  orderNum?: string;
  materNum?: string;
  materName?: string;
}

export interface QuickPreviewRequest {
  mode: QuickRequisitionMode;
  requisitionDate: string;
  sources: QuickRequisitionSource[];
}

export interface QuickRawLine {
  materId: number;
  materNum: string;
  materName: string;
  relationId: number;
  rawId: number;
  rawNum: string;
  rawSpecs: string;
  useType: "sheet" | "roll";
  productionNumber: number;
  requisitionNumber: number;
  requisitionWeight: number;
  remark?: string;
}

export interface QuickAssistLine {
  assistId: number;
  assistType: string;
  assistCode: string;
  assistName: string;
  assistSpec: string;
  unit: string;
  requisitionQty: number;
  remark?: string;
}

export interface QuickPreview {
  requisitionDate: string;
  sources: QuickRequisitionSource[];
  rawItems: QuickRawLine[];
  assistItems: QuickAssistLine[];
  completedItems: Array<{ orderItemId: number; materId: number; materNum: string; materName: string }>;
  warnings: Array<{ materId: number; materNum: string; materName: string; category: string; message: string }>;
}

export interface QuickConfirmRequest {
  preview: QuickPreviewRequest;
  rawRemark?: string;
  assistRemark?: string;
  rawItems: QuickRawLine[];
  assistItems: QuickAssistLine[];
}
