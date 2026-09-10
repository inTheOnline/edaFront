import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

export class AssetService {
  static fileToDataUrl(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  static async urlToDataUrl(url: string, init?: RequestInit): Promise<string> {
    if (url.startsWith("data:")) return url;
    const response = await fetch(url, init);
    if (!response.ok) throw new Error(`资源加载失败：${response.status} ${response.statusText}`);
    return this.fileToDataUrl(await response.blob());
  }

  static qrCode(value: string, width = 256): Promise<string> {
    return QRCode.toDataURL(value || " ", { width, margin: 1, errorCorrectionLevel: "M" });
  }

  static code128(value: string, options: JsBarcode.Options = {}): string {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, value || " ", { format: "CODE128", displayValue: true, margin: 4, ...options });
    return canvas.toDataURL("image/png");
  }

  static async normalize(assets: Record<string, string | Blob | Promise<string>>): Promise<Record<string, string>> {
    const entries = await Promise.all(
      Object.entries(assets).map(async ([key, asset]) => {
        const value = await asset;
        if (value instanceof Blob) return [key, await this.fileToDataUrl(value)] as const;
        return [key, value.startsWith("data:") ? value : await this.urlToDataUrl(value)] as const;
      })
    );
    return Object.fromEntries(entries);
  }
}
