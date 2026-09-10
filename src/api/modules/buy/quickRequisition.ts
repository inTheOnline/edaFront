import http from "@/api";
import type { QuickConfirmRequest, QuickPreview, QuickPreviewRequest } from "@/api/interface/buy/quickRequisition";

export const previewQuickRequisition = (data: QuickPreviewRequest) =>
  http.post<QuickPreview>("/buy/quick-requisition/preview", data);

export const confirmQuickRequisition = (data: QuickConfirmRequest) =>
  http.post("/buy/quick-requisition/confirm", data);
