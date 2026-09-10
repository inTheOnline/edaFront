import { PdfService, type PdfDocumentDefinition } from "@/modules/document-pdf";
import type { Content, TableCell } from "pdfmake/interfaces";
import type { OutgoingOrder } from "../service";

const MM = 72 / 25.4;
export type OutgoingOrderPdfType = "outgoing" | "return";

const text = (value: unknown) => value == null ? "" : String(value);
const printNumber = (value: unknown) => text(value).replace(/^\s*NO\.\s*/i, "");
const dateText = (value: string) => {
  const [year, month, day] = value.split("-");
  return year && month && day ? `${year}年${month}月${day}日` : value;
};
const vertical = (value: string, x: number, y: number): Content => ({
  text: value.split("").join("\n"),
  absolutePosition: { x: x * MM, y: y * MM },
  bold: true,
  fontSize: 8,
  lineHeight: 1.05,
  alignment: "center"
});
const cell = (value: unknown, style?: string): TableCell => {
  const valueText = text(value);
  const resolvedStyle = style || (/^\d+(?:\.\d+)?$/.test(valueText.trim()) ? "numericCell" : undefined);
  return { text: valueText, style: resolvedStyle, alignment: "center", bold: false };
};
const headerCell = (value: string): TableCell => ({
  text: value,
  style: "tableHeader",
  alignment: "center",
  bold: true,
  margin: value.includes("\n") ? undefined : [0, 5, 0, 0]
});
const emptyRow = (columns: number): TableCell[] => Array.from({ length: columns }, () => cell("\u00a0"));

export const buildOutgoingOrderPdfDefinition = (
  order: OutgoingOrder,
  type: OutgoingOrderPdfType = "outgoing"
): PdfDocumentDefinition => {
  const isReturnOrder = type === "return";
  const headers = isReturnOrder
    ? ["物料编号", "物料名称", "加工工艺", "退货原因", "单位", "数量", "备注"]
    : ["序\n号", "品番号", "加工工艺", "单位", "数量", "吸塑\n规格", "吸塑\n数量", "纸箱\n规格", "纸箱\n数量", "小号\n胶框", "中号\n胶框", "隔板\n数量", "备注"];
  const widths = isReturnOrder
    ? [90, 95, 90, 115, 50, 60, 60]
    : [18, 76, 70, 30, 42, 47, 40, 55, 40, 36, 36, 36, 52];
  const rows = isReturnOrder
    ? order.rows.map(row => [
      cell(row.materNum, "importantCell"), cell(row.materName, "importantCell"), cell(row.workName, "importantCell"),
      cell(row.returnReason), cell(row.unit), cell(row.number, "quantityCell"), cell(row.remark)
    ])
    : order.rows.map((row, index) => [
      cell(index + 1), cell(row.materNum, "importantCell"), cell(row.workName, "importantCell"),
      cell(row.unit), cell(row.number, "quantityCell"),
      cell(row.sendPvc ? row.pvcSpec : ""), cell(row.sendPvc ? row.pvcQuantity : ""),
      cell(row.sendBox ? row.boxSpec : ""), cell(row.sendBox ? row.boxQuantity : ""),
      cell(row.smallFrameQuantity), cell(row.mediumFrameQuantity), cell(row.spacerQuantity), cell(row.remark)
    ]);

  return {
    pageSize: { width: 240 * MM, height: 140 * MM },
    pageOrientation: "landscape",
    pageMargins: [5 * MM, 2 * MM, 15 * MM, 14 * MM],
    defaultStyle: { font: "NotoSansSC", fontSize: 10 },
    background: () => [
      vertical("第一联存根", 231, 16),
      vertical("，第二联供应商", 231, 47),
      vertical("，第三联财务", 231, 91)
    ],
    content: [
      { text: "深圳市意达五金制品有限公司", alignment: "center", bold: true, fontSize: 22, margin: [0, 0, 0, 2] },
      { text: "地址：深圳市光明新区公明街道上村莲塘工业区德兴工业园6B栋", alignment: "center", bold: false, fontSize: 12, margin: [0, 0, 0, 2] },
      {
        columns: [
          { text: "电话：0755-27193495", alignment: "right" },
          { text: "传真：0755-27193285", alignment: "center" }
        ],
        columnGap: 50,
        bold: false,
        fontSize: 12,
        margin: [70, 0, 60, 3]
      },
      { text: isReturnOrder ? "退货单" : "委外加工单", alignment: "center", bold: true, fontSize: 20, margin: [0, 0, 0, 2] },
      { text: `NO. ${printNumber(order.printNum)}`, alignment: "right", bold: true, fontSize: 16, margin: [0, 0, 0, 2] },
      {
        columns: [
          { text: `委外加工商：${text(order.supName)}`, fontSize: 16 },
          { text: dateText(order.subcDate), alignment: "right", fontSize: 12 }
        ],
        bold: false,
        margin: [0, 0, 10, 2]
      },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          widths,
          body: [
            headers.map(headerCell),
            ...rows,
            ...Array.from({ length: Math.max(0, 5 - rows.length) }, () => emptyRow(headers.length))
          ]
        },
        layout: {
          hLineWidth: () => 1.1,
          vLineWidth: () => 1.1,
          hLineColor: () => "#333333",
          vLineColor: () => "#333333",
          paddingTop: row => row === 0 ? 7 : 6,
          paddingBottom: row => row === 0 ? 7 : 6,
          paddingLeft: () => 2,
          paddingRight: () => 2
        }
      },
      {
        columns: [
          { text: "外协单位及经手人签收：", width: "*" },
          { text: "仓库：", width: 150 },
          { text: `制单：${text(order.creatorName)}`, width: 160 }
        ],
        font: "NotoSansSC",
        bold: false,
        fontSize: 17,
        margin: [3, 8, 0, 0]
      }
    ],
    styles: {
      tableHeader: { bold: true, fontSize: 12, alignment: "center" },
      importantCell: { fontSize: 11 },
      numericCell: { fontSize: 12 },
      quantityCell: { fontSize: 11 }
    }
  };
};

export const printOutgoingOrderPdf = async (order: OutgoingOrder, type: OutgoingOrderPdfType = "outgoing") => {
  const boldFont = "/fonts/NotoSansSC-Bold.ttf";
  const regularFont = "/fonts/NotoSansSC-Regular.ttf";
  const fontFiles = {
    normal: regularFont,
    bold: boldFont,
    italics: regularFont,
    bolditalics: boldFont
  };
  await new PdfService("NotoSansSC", fontFiles).print(buildOutgoingOrderPdfDefinition(order, type));
};
