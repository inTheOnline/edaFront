import type { Content, ContentColumns, ContentImage, ContentTable, DynamicContent } from "pdfmake/interfaces";
import { resolveField } from "./formatters";
import type { FieldConfig, PageTextConfig, PdfContent, PdfDocumentDefinition, PdfRecord, TemplateConfig, UnifiedDocumentModel } from "./types";

export class DocumentPdfBuilder {
  build(model: UnifiedDocumentModel, template: TemplateConfig): PdfDocumentDefinition {
    const content: Content[] = [this.title(model, template)];
    this.append(content, this.section(template.basicInfo, model.headerData, model));
    content.push(this.detailTable(model, template));
    this.append(content, this.section(template.summary, model.summaryData, model));
    this.append(content, this.section(template.approval, model.footerData, model));
    this.append(content, this.section(template.remarks, model.footerData, model));
    this.append(content, this.assetSection(template.assets, model));

    return {
      pageSize: template.pageSize || "A4",
      pageOrientation: template.pageOrientation || "portrait",
      pageMargins: template.pageMargins || [32, 52, 32, 52],
      header: this.pageContent(template.header, model),
      footer: this.footer(template, model),
      content,
      defaultStyle: { font: "NotoSansSC", fontSize: 9, ...(template.defaultStyle || {}) },
      styles: {
        documentTitle: { fontSize: 18, bold: true, alignment: "center", margin: [0, 0, 0, 12] },
        section: { margin: [0, 0, 0, 10] },
        tableHeader: { bold: true, alignment: "center", fillColor: "#eeeeee" },
        ...(template.styles || {})
      }
    } as PdfDocumentDefinition;
  }

  private title(model: UnifiedDocumentModel, template: TemplateConfig): Content {
    return { text: model.documentTitle, style: template.title?.style || "documentTitle", alignment: template.title?.alignment || "center" };
  }

  private detailTable(model: UnifiedDocumentModel, template: TemplateConfig): ContentTable {
    const config = template.detailTable;
    const header = config.columns.map(column => ({ text: column.label, style: "tableHeader", alignment: column.alignment || "center" }));
    const rows = model.detailData.map(row =>
      config.columns.map(column => ({
        text: resolveField(row, column),
        alignment: column.alignment || "left",
        style: column.style,
        noWrap: false
      }))
    );
    return {
      table: {
        headerRows: config.headerRows ?? 1,
        dontBreakRows: config.dontBreakRows ?? false,
        keepWithHeaderRows: config.keepWithHeaderRows ?? 1,
        widths: config.columns.map(column => column.width || "*"),
        body: [header, ...rows]
      },
      layout: config.layout || "lightHorizontalLines",
      style: "section"
    };
  }

  private section(config: PageTextConfig | undefined, data: PdfRecord | undefined, model: UnifiedDocumentModel): Content | undefined {
    if (!config) return undefined;
    const nodes: Content[] = [];
    if (config.text) nodes.push({ text: config.text, style: config.style });
    if (config.fields?.length) {
      const width = Math.max(1, config.columns || 2);
      const columns: ContentColumns["columns"] = config.fields.map(field => this.field(field, data));
      const rows: Content[] = [];
      for (let i = 0; i < columns.length; i += width) rows.push({ columns: columns.slice(i, i + width), columnGap: 12 });
      nodes.push(...rows);
    }
    const assets = this.assetSection(config.assets, model);
    if (assets) nodes.push(assets);
    return nodes.length ? { stack: nodes, margin: config.margin || [0, 0, 0, 10] } : undefined;
  }

  private field(field: FieldConfig, data: PdfRecord | undefined): Content {
    return { text: [{ text: `${field.label}：`, bold: true }, { text: resolveField(data, field) }], alignment: field.alignment || "left", style: field.style, noWrap: field.noWrap, margin: [0, 2, 0, 2] };
  }

  private assetSection(config: PageTextConfig["assets"] | TemplateConfig["assets"], model: UnifiedDocumentModel): Content | undefined {
    const images = (config || []).flatMap(item => {
      const dataUrl = model.assets?.[item.assetKey];
      if (!dataUrl) return [];
      const image: ContentImage = { image: dataUrl, width: item.width, height: item.height, alignment: item.alignment || "center" };
      return item.label ? [{ stack: [{ text: item.label, alignment: item.alignment || "center" }, image] } as Content] : [image];
    });
    return images.length ? { columns: images, columnGap: 12 } : undefined;
  }

  private pageContent(config: PageTextConfig | undefined, model: UnifiedDocumentModel): DynamicContent | undefined {
    if (!config) return undefined;
    return () => this.section(config, model.headerData, model) || "";
  }

  private footer(template: TemplateConfig, model: UnifiedDocumentModel): DynamicContent | undefined {
    const config = template.footer;
    if (!config) return undefined;
    return (currentPage, pageCount) => {
      const parts: string[] = [];
      if (config.showPageNumber) parts.push(`第 ${currentPage} / ${pageCount} 页`);
      if (config.showMaker && model.maker) parts.push(`制单人：${model.maker}`);
      if (config.showPrintTime) parts.push(`打印时间：${String(model.printTime || new Date().toLocaleString("zh-CN"))}`);
      const fixed = this.section(config, model.footerData, model);
      return { stack: [fixed || "", { text: parts.join("    "), alignment: "center", fontSize: 8 }], margin: config.margin || [32, 6, 32, 0] };
    };
  }

  private append(target: Content[], node: Content | undefined) {
    if (node) target.push(node);
  }
}
