import http from "@/api";
import { RouteManage } from "@/api/interface/route";

export const getRouteTree = () => {
  return http.get<RouteManage.RouteTreeNode[]>("/menu/tree", {}, { loading: false });
};

export const createRoute = (params: RouteManage.CreateRoutePayload) => {
  return http.post<RouteManage.SaveRouteResult>("/menu/add", params, { loading: false });
};

export const updateRoute = (params: RouteManage.UpdateRoutePayload) => {
  return http.post<RouteManage.SaveRouteResult>("/menu/update", params, { loading: false });
};

export const moveRoute = (params: RouteManage.MoveRoutePayload) => {
  return http.post<RouteManage.MoveRouteResult>("/menu/move", params, { loading: false });
};

export const deleteRoute = (params: RouteManage.DeleteRoutePayload) => {
  return http.post<RouteManage.MoveRouteResult>("/menu/delete", params, { loading: false });
};
