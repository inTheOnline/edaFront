import http from "@/api";

export interface Seal {
  id: string;
  name: string;
  type: "seal" | "signature";
  ratio: number;
  widthCm: number;
  image: string;
}
export interface SealPage {
  width: number;
  height: number;
}
export interface SealMark {
  id: number;
  sealId: string;
  page: number;
  x: number;
  y: number;
  widthCm: number;
}
export interface SealSeam {
  id: number;
  sealId: string;
  pages: number[];
  edge: "left" | "right";
  y: number;
}
const options = { loading: false, cancel: false, timeout: 120000 };
export const getSeals = () => http.get<Seal[]>("/base/seal/list", undefined, options);
export const getSealPages = (data: FormData) => http.post<SealPage[]>("/base/seal/info", data, options);
export const getSealPreview = (data: FormData) => http.download("/base/seal/preview", data, options);
export const exportSealedPdf = (data: FormData) => http.download("/base/seal/export", data, options);

// 下载接口的业务错误可能以 JSON Blob 返回，不能将错误信息保存成 PDF。
export async function sealBlob(data: BlobPart): Promise<Blob> {
  const blob = data instanceof Blob ? data : new Blob([data]);
  if (blob.type.includes("json")) {
    const error = JSON.parse(await blob.text());
    throw new Error(error.message || "处理失败");
  }
  return blob;
}
