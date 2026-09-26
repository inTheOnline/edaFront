import { PdfService, type PdfDocumentDefinition } from "@/modules/document-pdf";
import type { Content, ContentTable, TableCell } from "pdfmake/interfaces";
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

export const buildOutgoingOrderPdfDefinition = (
  order: OutgoingOrder,
  type: OutgoingOrderPdfType = "outgoing",
  minRows = 5
): PdfDocumentDefinition => {
  const isReturnOrder = type === "return";
  const headers = isReturnOrder
    ? ["序号", "物料编号", "物料名称", "加工工艺", "退货原因", "单位", "数量", "备注"]
    : ["序\n号", "品番号", "加工工艺", "单位", "数量", "吸塑\n规格", "吸塑\n数量", "纸箱\n规格", "纸箱\n数量", "小号\n胶框", "中号\n胶框", "隔板\n数量", "备注"];
  const columnWeights = isReturnOrder
    ? [25, 90, 95, 90, 115, 35, 60, 60]
    : [18, 76, 70, 30, 42, 47, 40, 55, 40, 36, 36, 36, 52];
  const tableWidth = 220 * MM;
  const weightSum = columnWeights.reduce((sum, width) => sum + width, 0);
  const widths = columnWeights.map(width => width / weightSum * (tableWidth - columnWeights.length * 5.1 - 1.1));
  const rows = isReturnOrder
    ? order.rows.map((row, index) => [
      cell(index + 1), cell(row.materNum, "importantCell"), cell(row.materName, "importantCell"), cell(row.workName, "importantCell"),
      cell(row.returnReason), cell(row.unit), cell(row.number, "quantityCell"), cell(row.remark)
    ])
    : order.rows.map((row, index) => [
      cell(index + 1), cell(row.materNum, "importantCell"), cell(row.workName, "importantCell"),
      cell(row.unit), cell(row.number, "quantityCell"),
      cell(row.sendPvc ? row.pvcSpec : ""), cell(row.sendPvc ? row.pvcQuantity : ""),
      cell(row.sendBox ? row.boxSpec : ""), cell(row.sendBox ? row.boxQuantity : ""),
      cell(row.smallFrameQuantity), cell(row.mediumFrameQuantity), cell(row.spacerQuantity), cell(row.remark)
    ]);

  const detailTable = (body: TableCell[][], header = false): ContentTable => ({
    table: { widths, body: body.length ? body : [headers.map(() => cell("\u00a0"))] },
    layout: {
      hLineWidth: line => !header && line === 0 ? 0 : 1.1,
      vLineWidth: () => 1.1,
      hLineColor: () => "#333333",
      vLineColor: () => "#333333",
      paddingTop: () => header ? 5 : 3,
      paddingBottom: () => header ? 5 : 3,
      paddingLeft: () => 2,
      paddingRight: () => 2
    }
  });

  return {
    pageSize: { width: 240 * MM, height: 140 * MM },
    pageOrientation: "landscape",
    pageMargins: [5 * MM, 3 * MM, 15 * MM, 20 * MM],
    defaultStyle: { font: "NotoSansSC", fontSize: 10 },
    background: () => [
      vertical("第一联存根", 231, 16),
      vertical("，第二联供应商", 231, 47),
      vertical("，第三联财务", 231, 91)
    ],
    footer: (page, total) => ({
      margin: [5 * MM, 3 * MM, 15 * MM, 0],
      stack: [
        {
          columns: [
            { text: "外协单位及经手人签收：", width: "*" },
            { text: "仓库：", width: 130 },
            { text: `制单：${text(order.creatorName)}`, width: 155 }
          ],
          fontSize: 11
        },
        { text: `页码：${page}/${total}`, alignment: "right", fontSize: 9, margin: [0, 12, 0, 0] }
      ]
    }),
    content: [
      {
        // 完整抬头与列名一起重复，明细保持整行分页。
        table: {
          headerRows: 1,
          dontBreakRows: true,
          keepWithHeaderRows: 1,
          widths: [tableWidth],
          body: [
            [{ stack: [
              { text: "深圳市意达五金制品有限公司", alignment: "center", bold: true, fontSize: 17, margin: [0, 0, 0, 1] },
              { text: isReturnOrder ? "退货单" : "委外加工单", alignment: "center", bold: true, fontSize: 14, margin: [0, 0, 0, 2] },
              { text: "地址：深圳市光明新区公明街道上村莲塘工业区德兴工业园6B栋", alignment: "center", fontSize: 9 },
              { text: "电话：0755-27193495    传真：0755-27193285", alignment: "center", fontSize: 9, margin: [0, 0, 0, 3] },
              {
                columns: [
                  { text: `委外加工商：${text(order.supName)}`, width: "*" },
                  { text: dateText(order.subcDate), width: 115, alignment: "right" },
                  { text: `NO. ${printNumber(order.printNum)}`, width: 160, alignment: "right", bold: true }
                ],
                fontSize: 10,
                columnGap: 8,
                margin: [0, 0, 0, 3]
              },
              { text: `整单备注：${text(order.subcRemark)}`, fontSize: 10, margin: [0, 0, 0, 4] },
              detailTable([headers.map(headerCell)], true)
            ] }],
            ...rows.map(row => [detailTable([row])]),
            ...Array.from({ length: Math.max(0, minRows - rows.length) }, () => [detailTable([headers.map(() => cell("\u00a0"))])])
          ]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0
        }
      }
    ],
    styles: {
      tableHeader: { bold: true, fontSize: 10, alignment: "center" },
      importantCell: { fontSize: 11 },
      numericCell: { fontSize: 12 },
      quantityCell: { fontSize: 11 }
    }
  };
};

export const fitOutgoingOrderPdf = async (
  order: OutgoingOrder,
  type: OutgoingOrderPdfType,
  pageCount: (definition: PdfDocumentDefinition) => Promise<number>
): Promise<PdfDocumentDefinition> => {
  if (order.rows.length >= 5) return buildOutgoingOrderPdfDefinition(order, type);
  // 用实际字体排版判断，保留不会增加页数的最多空白行。
  const basePages = await pageCount(buildOutgoingOrderPdfDefinition(order, type, 0));
  for (let minRows = 5; minRows > order.rows.length; minRows--) {
    if (await pageCount(buildOutgoingOrderPdfDefinition(order, type, minRows)) <= basePages) {
      return buildOutgoingOrderPdfDefinition(order, type, minRows);
    }
  }
  return buildOutgoingOrderPdfDefinition(order, type, 0);
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
  const service = new PdfService("NotoSansSC", fontFiles);
  const definition = await fitOutgoingOrderPdf(order, type, async definition => {
    let pages = 0;
    const footer = definition.footer;
    await service.getBlob({
      ...definition,
      footer: (page, total, size) => {
        pages = total;
        return typeof footer === "function" ? footer(page, total, size) : footer || [];
      }
    });
    return pages;
  });
  await service.print(definition);
};
