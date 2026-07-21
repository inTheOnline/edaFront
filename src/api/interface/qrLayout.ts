import type { ReqPage } from "@/api/interface";

export type QrLayoutTemplateVisibility = "private" | "public";
export type QrLayoutTemplateScope = "all" | "mine" | "public";

export interface QrLayoutTemplateListParams extends Partial<ReqPage> {
  scope?: QrLayoutTemplateScope;
  keyword?: string;
}

export interface QrLayoutTemplateRecord {
  id: number;
  name: string;
  templateJson?: string;
  visibility: QrLayoutTemplateVisibility;
  ownerUserId: number;
  ownerUserName?: string;
  remark?: string;
  createTime?: string;
  updateTime?: string;
  editable: boolean;
}

export interface QrLayoutTemplatePage {
  records: QrLayoutTemplateRecord[];
  total: number;
}

export interface QrLayoutTemplateCreateParams {
  name: string;
  templateJson: string;
  visibility?: QrLayoutTemplateVisibility;
  remark?: string;
}

export interface QrLayoutTemplateUpdateParams {
  name: string;
  templateJson: string;
  remark?: string;
}

export interface QrLayoutTemplateCopyParams {
  name: string;
}
