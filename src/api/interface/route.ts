export namespace RouteManage {
  export type RouteId = number | string;

  export type RouteType = "catalog" | "page";

  export interface RouteMeta {
    title: string;
    icon: string;
    roles: string;
    activeMenu?: string;
    isLink?: string;
    isHide: boolean;
    isFull: boolean;
    isAffix: boolean;
    isKeepAlive: boolean;
  }

  export interface RouteTreeNode {
    id?: RouteId;
    parentId?: RouteId | null;
    routeType?: RouteType;
    path: string;
    name?: string;
    component?: string;
    redirect?: string;
    sort?: number;
    description?: string;
    meta: RouteMeta;
    children?: RouteTreeNode[];
  }

  export interface CreateRoutePayload {
    parentId?: RouteId | null;
    parentPath?: string;
    routeType: RouteType;
    name?: string;
    path: string;
    component?: string;
    redirect?: string;
    sort?: number;
    description?: string;
    meta: RouteMeta;
  }

  export interface UpdateRoutePayload extends CreateRoutePayload {
    id: RouteId;
  }

  export interface SaveRouteResult {
    id?: RouteId;
    success: boolean;
    message?: string;
  }

  export interface MoveRoutePayload {
    id: RouteId;
    parentId?: RouteId | null;
    parentPath?: string;
    previousParentId?: RouteId | null;
    previousParentPath?: string;
    sort: number;
    path: string;
  }

  export interface MoveRouteResult {
    success: boolean;
    message?: string;
  }

  export interface DeleteRoutePayload {
    id: RouteId;
  }
}
