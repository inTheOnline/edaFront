import dayjs from "dayjs";
import QRCode from "qrcode";
import type {
  QrLayoutDataTransform,
  QrLayoutElement,
  QrLayoutObjectDataSource,
  QrLayoutPaper,
  QrLayoutPreviewPage,
  QrLayoutSerialRule,
  QrLayoutTemplate
} from "./types";

const code128Patterns = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

export const fontOptions = [
  "宋体",
  "黑体",
  "微软雅黑",
  "微软雅黑 Light",
  "仿宋",
  "楷体",
  "Arial",
  "Calibri",
  "Times New Roman",
  "Consolas",
  "Tahoma",
  "Verdana"
];

export const paperPresets: QrLayoutPaper[] = [
  { name: "20 x 30", width: 20, height: 30, marginX: 1, marginY: 1, gap: 2, direction: 0, density: 8, speed: 4, offsetX: 0, offsetY: 0, mode: "gap" },
  { name: "30 x 40", width: 30, height: 40, marginX: 1, marginY: 1, gap: 2, direction: 0, density: 8, speed: 4, offsetX: 0, offsetY: 0, mode: "gap" },
  { name: "50 x 30", width: 50, height: 30, marginX: 1, marginY: 1, gap: 2, direction: 0, density: 8, speed: 4, offsetX: 0, offsetY: 0, mode: "gap" },
  { name: "80 x 60", width: 80, height: 60, marginX: 2, marginY: 2, gap: 2, direction: 0, density: 8, speed: 4, offsetX: 0, offsetY: 0, mode: "gap" },
  { name: "100 x 80", width: 100, height: 80, marginX: 2, marginY: 2, gap: 2, direction: 0, density: 8, speed: 4, offsetX: 0, offsetY: 0, mode: "gap" }
];

export const mmToDot = (mm: number) => Math.round(mm * 8);
export const createId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

export const defaultTransform = (): QrLayoutDataTransform => ({
  prefix: "",
  suffix: ""
});

export const defaultSerialRule = (): QrLayoutSerialRule => ({
  start: "001",
  end: "100",
  digits: 3,
  repeat: 1,
  step: 1
});

export const createObjectDataSource = (name = "数据源"): QrLayoutObjectDataSource => ({
  id: createId("ds"),
  name,
  valueType: "text",
  sourceType: "fixed",
  value: "",
  manualValue: "",
  dateFormat: "yyyyMMdd",
  dateOffset: 0,
  timeFormat: "HH:mm:ss",
  serial: defaultSerialRule(),
  compose: "",
  formula: "",
  required: false,
  transform: defaultTransform()
});

export const resolveExpression = (expression: string, values: Record<string, string>) => {
  return decodeTextEscapes(expression.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => values[key.trim()] ?? ""));
};

export const resolveElementValue = (element: QrLayoutElement, page?: QrLayoutPreviewPage) => {
  const values = page?.data[element.id] || resolveElementData(element, 0);
  return resolveExpression(element.expression, values);
};

export const resolveElementData = (element: QrLayoutElement, pageIndex = 0) => {
  const values: Record<string, string> = {};
  element.dataSources.forEach(source => {
    values[source.name] = resolveDataSource(source, values, pageIndex);
  });
  return values;
};

export const buildPrintPages = (template: QrLayoutTemplate): QrLayoutPreviewPage[] => {
  const pageCount = Math.max(1, ...template.elements.flatMap(item => item.dataSources.map(serialPageCount)));
  return Array.from({ length: pageCount }, (_, index) => ({
    index: index + 1,
    data: Object.fromEntries(template.elements.map(item => [item.id, resolveElementData(item, index)]))
  }));
};

export const renderQr = (content: string, size = 256, errorCorrectionLevel: "L" | "M" | "Q" | "H" = "M") => {
  return QRCode.toDataURL(content || " ", {
    width: size,
    margin: 1,
    errorCorrectionLevel,
    color: { dark: "#000000", light: "#ffffff" }
  });
};

export const buildCode128Bars = (content: string) => {
  const text = content || " ";
  const codes = [104, ...Array.from(text).map(char => Math.max(0, Math.min(95, char.charCodeAt(0) - 32)))];
  const checksum = codes.reduce((total, code, index) => total + (index === 0 ? code : code * index), 0) % 103;
  const sequence = [...codes, checksum, 106];
  const bars: { x: number; width: number }[] = [];
  let x = 0;
  sequence.forEach(code => {
    const pattern = code128Patterns[code] || code128Patterns[0];
    Array.from(pattern).forEach((widthText, index) => {
      const width = Number(widthText);
      if (index % 2 === 0) bars.push({ x, width });
      x += width;
    });
  });
  return { bars, total: x };
};

export const generateTspl = (template: QrLayoutTemplate, page: QrLayoutPreviewPage) => {
  const paper = template.paper;
  const lines = [
    `SIZE ${paper.width} mm,${paper.height} mm`,
    paper.mode === "blackMark" ? `BLINE ${paper.gap} mm,0 mm` : `GAP ${paper.gap} mm,0 mm`,
    `DENSITY ${paper.density}`,
    `SPEED ${paper.speed}`,
    `DIRECTION ${paper.direction}`,
    `REFERENCE ${mmToDot(paper.offsetX)},${mmToDot(paper.offsetY)}`,
    "CLS"
  ];

  [...template.elements]
    .filter(item => item.visible)
    .sort((a, b) => a.zIndex - b.zIndex)
    .forEach(item => {
      const x = mmToDot(item.x + paper.marginX);
      const y = mmToDot(item.y + paper.marginY);
      const width = mmToDot(item.width);
      const height = mmToDot(item.height);
      const rawValue = resolveElementValue(item, page);
      const value = escapeTspl(rawValue);
      if (item.type === "text") {
        rawValue.split(/\r?\n/).forEach((line, index) => {
          const lineY = y + mmToDot(index * Math.max(item.fontSize / 3, 3));
          lines.push(`TEXT ${x},${lineY},"TSS24.BF2",${item.rotate},${item.bold ? 2 : 1},${item.bold ? 2 : 1},"${escapeTspl(line)}"`);
        });
      }
      if (item.type === "qr") {
        const cell = Math.max(2, Math.round(width / 32));
        lines.push(`QRCODE ${x},${y},${item.errorCorrectionLevel},${cell},A,${item.rotate},M2,S7,"${value}"`);
        appendSourceText(lines, item, value, paper);
      }
      if (item.type === "code128") {
        lines.push(`BARCODE ${x},${y},"128",${height},1,${item.rotate},2,2,"${value}"`);
        appendSourceText(lines, item, value, paper);
      }
      if (item.type === "line") {
        lines.push(`BAR ${x},${y},${width},${Math.max(1, mmToDot(item.strokeWidth))}`);
      }
      if (item.type === "rect") {
        const stroke = Math.max(1, mmToDot(item.strokeWidth));
        lines.push(item.fill ? `BAR ${x},${y},${width},${height}` : `BOX ${x},${y},${x + width},${y + height},${stroke}`);
      }
      if (item.type === "image") {
        lines.push(`REM 图片 ${item.name} 需要本地服务转黑白位图后输出`);
      }
    });

  lines.push("PRINT 1,1");
  return lines.join("\n");
};

export const generateBatchTspl = (template: QrLayoutTemplate, onlyFirst = false) => {
  const pages = buildPrintPages(template);
  return (onlyFirst ? pages.slice(0, 1) : pages).map(page => generateTspl(template, page)).join("\n");
};

export const sourceTextPoint = (item: Extract<QrLayoutElement, { type: "qr" | "code128" }>) => {
  const { sourceText } = item;
  const padding = 1;
  const textHeight = Math.max(sourceText.fontSize / 3, 3);
  const textWidth = Math.max(item.width, 10);
  if (sourceText.position === "top") return { x: item.x + sourceText.offsetX, y: item.y - textHeight - padding + sourceText.offsetY, width: textWidth, height: textHeight };
  if (sourceText.position === "left") return { x: item.x - textWidth - padding + sourceText.offsetX, y: item.y + sourceText.offsetY, width: textWidth, height: textHeight };
  if (sourceText.position === "right") return { x: item.x + item.width + padding + sourceText.offsetX, y: item.y + sourceText.offsetY, width: textWidth, height: textHeight };
  return { x: item.x + sourceText.offsetX, y: item.y + item.height + padding + sourceText.offsetY, width: textWidth, height: textHeight };
};

export const downloadText = (filename: string, content: string, type = "application/json") => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const readFileAsText = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const readFileAsDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const cloneElement = (item: QrLayoutElement): QrLayoutElement => ({
  ...JSON.parse(JSON.stringify(item)),
  id: createId(item.type),
  name: `${item.name} 副本`,
  x: item.x + 2,
  y: item.y + 2,
  zIndex: item.zIndex + 1
});

const resolveDataSource = (source: QrLayoutObjectDataSource, values: Record<string, string>, pageIndex: number) => {
  let value = "";
  if (source.sourceType === "fixed") value = source.value;
  if (source.sourceType === "manual") value = source.manualValue || source.value;
  if (source.sourceType === "date") value = dayjs().add(Number(source.dateOffset) || 0, "day").format(toDayjsFormat(source.dateFormat));
  if (source.sourceType === "time") value = dayjs().format(source.timeFormat || "HH:mm:ss");
  if (source.sourceType === "serial") value = serialValue(source.serial, pageIndex);
  if (source.sourceType === "compose") value = resolveExpression(source.compose || "", values);
  if (source.sourceType === "formula") value = evaluateFormula(resolveExpression(source.formula || "", values));
  return applyTransform(String(value), source.transform);
};

const serialValue = (rule: QrLayoutSerialRule, pageIndex: number) => {
  const start = Number(rule.start);
  const repeat = Math.max(Number(rule.repeat) || 1, 1);
  const step = Math.max(Number(rule.step) || 1, 1);
  const digits = Math.max(Number(rule.digits) || rule.start.length || 1, 1);
  const value = start + Math.floor(pageIndex / repeat) * step;
  return String(value).padStart(digits, "0");
};

const serialPageCount = (source: QrLayoutObjectDataSource) => {
  if (source.sourceType !== "serial") return 1;
  const start = Number(source.serial.start);
  const end = Number(source.serial.end);
  const step = Math.max(Number(source.serial.step) || 1, 1);
  const repeat = Math.max(Number(source.serial.repeat) || 1, 1);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end) return 1;
  return (Math.floor((end - start) / step) + 1) * repeat;
};

const applyTransform = (rawValue: string, transform: QrLayoutDataTransform) => {
  const value = rawValue || "";
  return `${transform.prefix || ""}${value}${transform.suffix || ""}`;
};

const evaluateFormula = (expression: string) => {
  if (!/^[\d+\-*/().\s]+$/.test(expression)) return "";
  try {
    return String(Function(`"use strict";return (${expression})`)());
  } catch {
    return "";
  }
};

const appendSourceText = (
  lines: string[],
  item: Extract<QrLayoutElement, { type: "qr" | "code128" }>,
  value: string,
  paper: QrLayoutPaper
) => {
  if (!item.sourceText.visible) return;
  const pos = sourceTextPoint(item);
  lines.push(`TEXT ${mmToDot(pos.x + paper.marginX)},${mmToDot(pos.y + paper.marginY)},"TSS24.BF2",0,1,1,"${value}"`);
};

const toDayjsFormat = (format: string) => format.replace(/yyyy/g, "YYYY").replace(/dd/g, "DD");
const escapeTspl = (value: string) => value.replace(/"/g, "'");
const decodeTextEscapes = (value: string) => {
  return value
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\f/g, "\f")
    .replace(/\\v/g, "\v");
};
