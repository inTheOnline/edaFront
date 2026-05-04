import type {
  QrLayoutBaseElement,
  QrLayoutElement,
  QrLayoutObjectDataSource,
  QrLayoutSourceText,
  QrLayoutTemplate
} from "./types";
import { createObjectDataSource, paperPresets } from "./utils";

const sourceText = (): QrLayoutSourceText => ({
  visible: false,
  position: "bottom",
  offsetX: 0,
  offsetY: 0,
  fontSize: 8,
  fontFamily: "Arial",
  bold: false
});

const baseElement = <T extends QrLayoutElement["type"]>(
  type: T,
  name: string,
  x: number,
  y: number,
  width: number,
  height: number
): QrLayoutBaseElement & { type: T } => ({
  id: `${type}_${name}`,
  type,
  name,
  expression: "{{内容}}",
  dataSources: [],
  x,
  y,
  width,
  height,
  rotate: 0,
  zIndex: 1,
  locked: false,
  visible: true,
  fontSize: 10,
  fontFamily: "Arial",
  bold: false,
  align: "left",
  lineHeight: 1.2
});

const fixed = (name: string, value: string): QrLayoutObjectDataSource => ({
  ...createObjectDataSource(name),
  sourceType: "fixed",
  value
});

const date = (name: string): QrLayoutObjectDataSource => ({
  ...createObjectDataSource(name),
  sourceType: "date",
  dateFormat: "yyyyMMdd",
  dateOffset: 0
});

const serial = (name: string): QrLayoutObjectDataSource => ({
  ...createObjectDataSource(name),
  sourceType: "serial",
  serial: { start: "001", end: "100", digits: 3, repeat: 1, step: 1 }
});

const compose = (name: string, value: string): QrLayoutObjectDataSource => ({
  ...createObjectDataSource(name),
  sourceType: "compose",
  compose: value
});

export const createDefaultTemplate = (): QrLayoutTemplate => {
  const commonSources = [
    fixed("产品名称", "汇流排"),
    fixed("客户料号", "3003112740"),
    date("生产日期"),
    serial("流水号"),
    fixed("供应商代码", "6A97")
  ];
  const qrSources = [...commonSources, compose("内容", "{{产品名称}}{{客户料号}}{{生产日期}}{{流水号}}{{供应商代码}}")];
  return {
    version: "2.0.0",
    name: "企业二维码标签",
    paper: { ...paperPresets[2], name: "50 x 30" },
    elements: [
      {
        ...baseElement("qr", "二维码", 4, 6, 16, 16),
        zIndex: 1,
        expression: "{{内容}}",
        dataSources: qrSources,
        errorCorrectionLevel: "H",
        sourceText: sourceText()
      },
      {
        ...baseElement("text", "产品名称", 24, 7, 22, 5),
        zIndex: 2,
        expression: "{{产品名称}}",
        dataSources: [fixed("产品名称", "汇流排")],
        fontSize: 12,
        fontFamily: "宋体",
        autoFit: false
      },
      {
        ...baseElement("text", "客户料号", 24, 13, 22, 5),
        zIndex: 3,
        expression: "{{客户料号}}",
        dataSources: [fixed("客户料号", "3003112740")],
        autoFit: false
      },
      {
        ...baseElement("text", "日期流水", 24, 18, 22, 5),
        zIndex: 4,
        expression: "{{生产日期}}{{流水号}}",
        dataSources: [date("生产日期"), serial("流水号")],
        autoFit: false
      },
      {
        ...baseElement("text", "供应商代码", 24, 23, 22, 5),
        zIndex: 5,
        expression: "{{供应商代码}}",
        dataSources: [fixed("供应商代码", "6A97")],
        autoFit: false
      }
    ]
  };
};

export const templateExamples: QrLayoutTemplate[] = [
  createDefaultTemplate(),
  {
    ...createDefaultTemplate(),
    name: "80x60 产品条码标签",
    paper: { ...paperPresets[3], name: "80 x 60" },
    elements: [
      {
        ...baseElement("rect", "外框", 3, 3, 74, 54),
        zIndex: 1,
        strokeWidth: 0.3,
        fill: false
      },
      {
        ...baseElement("qr", "二维码", 6, 15, 24, 24),
        zIndex: 2,
        expression: "{{内容}}",
        dataSources: [fixed("产品名称", "汇流排"), fixed("客户料号", "3003112740"), date("生产日期"), serial("流水号"), fixed("供应商代码", "6A97"), compose("内容", "{{产品名称}}|{{客户料号}}|{{生产日期}}|{{流水号}}|{{供应商代码}}")],
        errorCorrectionLevel: "H",
        sourceText: { ...sourceText(), visible: true, offsetY: 1 }
      },
      {
        ...baseElement("text", "标题", 35, 9, 36, 8),
        zIndex: 3,
        expression: "{{标题}}",
        dataSources: [fixed("标题", "汇流排")],
        fontSize: 16,
        fontFamily: "黑体",
        bold: true,
        autoFit: false
      },
      {
        ...baseElement("code128", "Code128", 35, 22, 36, 12),
        zIndex: 4,
        expression: "{{条码}}",
        dataSources: [fixed("客户料号", "3003112740"), serial("流水号"), compose("条码", "{{客户料号}}{{流水号}}")],
        sourceText: { ...sourceText(), visible: true, offsetY: 1 }
      },
      {
        ...baseElement("text", "备注", 35, 42, 36, 7),
        zIndex: 5,
        expression: "日期：{{生产日期}}",
        dataSources: [date("生产日期")],
        autoFit: false
      }
    ]
  }
];
