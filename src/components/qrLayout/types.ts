export type QrLayoutElementType = "text" | "qr" | "code128" | "image" | "line" | "rect";
export type QrLayoutPrintMode = "gap" | "blackMark";
export type QrLayoutValueType = "text" | "number";
export type QrLayoutSourceType = "fixed" | "manual" | "date" | "time" | "serial" | "compose" | "formula";
export type QrLayoutDateFormat = "yyyyMMdd" | "yyyy/MM/dd" | "yyyy-MM-dd" | "yyyy年MM月dd日";

export interface QrLayoutPaper {
  name: string;
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
  mode: QrLayoutPrintMode;
}

export interface QrLayoutSerialRule {
  start: string;
  end: string;
  digits: number;
  repeat: number;
  step: number;
}

export interface QrLayoutDataTransform {
  prefix: string;
  suffix: string;
}

export interface QrLayoutObjectDataSource {
  id: string;
  name: string;
  valueType: QrLayoutValueType;
  sourceType: QrLayoutSourceType;
  value: string;
  manualValue: string;
  dateFormat: QrLayoutDateFormat;
  dateOffset: number;
  timeFormat: string;
  serial: QrLayoutSerialRule;
  compose: string;
  formula: string;
  required: boolean;
  transform: QrLayoutDataTransform;
}

export interface QrLayoutSourceText {
  visible: boolean;
  position: "top" | "bottom" | "left" | "right";
  offsetX: number;
  offsetY: number;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
}

export interface QrLayoutBaseElement {
  id: string;
  type: QrLayoutElementType;
  name: string;
  expression: string;
  dataSources: QrLayoutObjectDataSource[];
  x: number;
  y: number;
  width: number;
  height: number;
  rotate: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  align: "left" | "center" | "right";
  lineHeight: number;
}

export interface QrLayoutTextElement extends QrLayoutBaseElement {
  type: "text";
  autoFit: boolean;
}

export interface QrLayoutQrElement extends QrLayoutBaseElement {
  type: "qr";
  errorCorrectionLevel: "L" | "M" | "Q" | "H";
  sourceText: QrLayoutSourceText;
}

export interface QrLayoutCode128Element extends QrLayoutBaseElement {
  type: "code128";
  sourceText: QrLayoutSourceText;
}

export interface QrLayoutImageElement extends QrLayoutBaseElement {
  type: "image";
  src: string;
  fit: "contain" | "cover" | "fill";
  dither: boolean;
}

export interface QrLayoutLineElement extends QrLayoutBaseElement {
  type: "line";
  strokeWidth: number;
}

export interface QrLayoutRectElement extends QrLayoutBaseElement {
  type: "rect";
  strokeWidth: number;
  fill: boolean;
}

export type QrLayoutElement =
  | QrLayoutTextElement
  | QrLayoutQrElement
  | QrLayoutCode128Element
  | QrLayoutImageElement
  | QrLayoutLineElement
  | QrLayoutRectElement;

export interface QrLayoutTemplate {
  version: string;
  name: string;
  paper: QrLayoutPaper;
  elements: QrLayoutElement[];
}

export interface QrLayoutPreviewPage {
  index: number;
  data: Record<string, Record<string, string>>;
}
