import pdfMake from "pdfmake/build/pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

export interface PdfFontFiles {
  normal: string;
  bold: string;
  italics: string;
  bolditalics: string;
}

export class PdfService {
  private fontReady?: Promise<void>;

  constructor(
    private readonly fontName = "NotoSansSC",
    private readonly fontFiles: PdfFontFiles = {
      normal: "/fonts/NotoSansSC-Regular.ttf",
      bold: "/fonts/NotoSansSC-Bold.ttf",
      italics: "/fonts/NotoSansSC-Regular.ttf",
      bolditalics: "/fonts/NotoSansSC-Bold.ttf"
    },
    private readonly additionalFontFiles: Record<string, PdfFontFiles> = {}
  ) {}

  registerFonts(): Promise<void> {
    if (!this.fontReady) this.fontReady = this.loadFonts();
    return this.fontReady;
  }

  async getBlob(definition: TDocumentDefinitions): Promise<Blob> {
    await this.registerFonts();
    return new Promise(resolve => pdfMake.createPdf(definition).getBlob(resolve));
  }

  async preview(definition: TDocumentDefinitions): Promise<string> {
    const url = URL.createObjectURL(await this.getBlob(definition));
    const preview = window.open(url, "_blank");
    if (!preview) {
      URL.revokeObjectURL(url);
      throw new Error("浏览器阻止了 PDF 预览窗口");
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
    return url;
  }

  async download(definition: TDocumentDefinitions, filename: string): Promise<void> {
    const url = URL.createObjectURL(await this.getBlob(definition));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async print(definition: TDocumentDefinitions): Promise<void> {
    const url = URL.createObjectURL(await this.getBlob(definition));
    const preview = window.open(url, "_blank");
    if (!preview) {
      URL.revokeObjectURL(url);
      throw new Error("浏览器阻止了 PDF 打印窗口");
    }
    preview.addEventListener("load", () => preview.print(), { once: true });
    window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
  }

  private async loadFonts(): Promise<void> {
    const fontFamilies = { [this.fontName]: this.fontFiles, ...this.additionalFontFiles };
    const files = [...new Set(Object.values(fontFamilies).flatMap(files => Object.values(files)))];
    const loaded = await Promise.all(files.map(async url => [this.fileName(url), await this.fetchBase64(url)] as const));
    pdfMake.vfs = { ...(pdfMake.vfs || {}), ...Object.fromEntries(loaded) };
    pdfMake.fonts = {
      ...(pdfMake.fonts || {}),
      ...Object.fromEntries(Object.entries(fontFamilies).map(([name, files]) => [
        name,
        Object.fromEntries(Object.entries(files).map(([style, url]) => [style, this.fileName(url)]))
      ]))
    };
  }

  private async fetchBase64(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`字体加载失败：${response.status} ${response.statusText}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    const size = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += size) binary += String.fromCharCode(...bytes.subarray(offset, offset + size));
    return btoa(binary);
  }

  private fileName(url: string) {
    return url.split("/").pop() || url;
  }
}
