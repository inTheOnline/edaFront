import type { Seal } from "@/api/modules/seal";

export const CM = 72 / 2.54;
export function sealSize(seal: Seal, widthCm = seal.widthCm) {
  const width = (seal.type === "signature" ? widthCm : 4 / Math.max(1, seal.ratio)) * CM;
  return { width, height: width * seal.ratio };
}

export function parsePages(text: string, count: number): number[] {
  if (!text.trim()) throw new Error("请输入页码，例如 1-5,8,10");
  const pages = new Set<number>();
  for (const part of text.replace(/，/g, ",").split(",")) {
    const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error("页码格式错误，请使用 1-5,8,10");
    const start = Number(match[1]),
      end = Number(match[2] || match[1]);
    if (start < 1 || end < start || end > count) throw new Error(`页码应在 1-${count} 范围内，范围不能倒序`);
    for (let page = start; page <= end; page++) {
      if (pages.has(page)) throw new Error("同一组不能填写重复页码");
      pages.add(page);
    }
  }
  if (pages.size < 2) throw new Error("每组骑缝章至少需要两页");
  return [...pages].sort((a, b) => a - b);
}

export const clamp = (value: number, max: number) => Math.max(0, Math.min(value, Math.max(0, max)));
