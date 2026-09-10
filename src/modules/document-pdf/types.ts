import type { Content, ContentColumns, ContentImage, ContentTable, PageOrientation, PageSize, StyleDictionary, TDocumentDefinitions } from "pdfmake/interfaces";

export type PdfValue = string | number | boolean | Date | null | undefined;
export type PdfRecord = Record<string, unknown>;
export type TextAlignment = "left" | "center" | "right" | "justify";
export type OverflowStrategy = "wrap" | "truncate";

export interface UnifiedDocumentModel {
  documentType: string;
  documentTitle: string;
  headerData: PdfRecord;
  detailData: PdfRecord[];
  summaryData?: PdfRecord;
  footerData?: PdfRecord;
  assets?: Record<string, string>;
  maker?: string;
  printTime?: Date | string;
}

export interface DataAdapter<TSource> {
  adapt(source: TSource): UnifiedDocumentModel | Promise<UnifiedDocumentModel>;
}

export type ValueFormat =
  | { type: "text" }
  | { type: "number"; digits?: number; useGrouping?: boolean }
  | { type: "amount"; digits?: number; currency?: string }
  | { type: "date"; pattern?: string };

export interface FieldConfig {
  label: string;
  field: string;
  format?: ValueFormat;
  emptyText?: string;
  alignment?: TextAlignment;
  overflow?: OverflowStrategy;
  maxLength?: number;
  noWrap?: boolean;
  style?: string | string[];
}

export interface DetailColumnConfig extends FieldConfig {
  width?: number | "auto" | "*";
}

export interface AssetBlockConfig {
  assetKey: string;
  label?: string;
  width?: number;
  height?: number;
  alignment?: TextAlignment;
}

export interface PageTextConfig {
  text?: string;
  fields?: FieldConfig[];
  assets?: AssetBlockConfig[];
  columns?: number;
  margin?: [number, number, number, number];
  style?: string | string[];
}

export interface DetailTableConfig {
  columns: DetailColumnConfig[];
  headerRows?: number;
  dontBreakRows?: boolean;
  keepWithHeaderRows?: number;
  layout?: ContentTable["layout"];
}

export interface TemplateConfig {
  pageSize?: PageSize;
  pageOrientation?: PageOrientation;
  pageMargins?: number | [number, number] | [number, number, number, number];
  defaultStyle?: TDocumentDefinitions["defaultStyle"];
  styles?: StyleDictionary;
  title?: Partial<FieldConfig>;
  header?: PageTextConfig;
  footer?: PageTextConfig & { showPageNumber?: boolean; showMaker?: boolean; showPrintTime?: boolean };
  basicInfo?: PageTextConfig;
  detailTable: DetailTableConfig;
  summary?: PageTextConfig;
  approval?: PageTextConfig;
  remarks?: PageTextConfig;
  assets?: AssetBlockConfig[];
}

export interface BuildContext {
  model: UnifiedDocumentModel;
  template: TemplateConfig;
}

export type PdfDocumentDefinition = TDocumentDefinitions;
export type PdfContent = Content;
export type PdfColumns = ContentColumns;
export type PdfImage = ContentImage;
