import http from "@/api";
import { User } from "@/api/interface/users";
import { Role,RoleDTO } from "@/api/interface/role";
import { ReqPage,ReqPageT } from "@/api/interface/index";
export const getAllUser = (params: ReqPage) => {
  return http.get<User[]>("/user/select/all", params);
}
export const addUser = (user: User ) => {
  return http.post<any>("/user/add", user);
}
export const deleteUsers = (ids: number[] ) => {
  return http.post<any>("/user/delete/many", ids);
}
export const update = (user: User ) => {
  return http.post<any>("/user/update", user);
}
export const rolesMap = () => {
  return http.get<Role[]>("/role/map");
}
export const addRole = (role: Partial<Role>) => {
  return http.post<Role>("/role/add", role);
}
export const getRoleUsers = (roleId: number | string) =>{
  return http.get<any[]>(`/role/${roleId}/users`);
}
export const getRoles = () =>{
  return http.get<ReqPageT<Role>>("/power/getRolePower");
}
export const savePower = (params) =>{
  console.log("接口前为",params)
  // 本次改动：后端已支持 extraPermissions，保存时保留业务权限字段。
  const list = Object.keys(params).map(key => ({
      id: key,
      enabled: params[key].enabled,
      access: params[key].access || [],
      extraPermissions: params[key].extraPermissions
   }));
  return http.post<ReqPageT<Role>>("/power/updatePower",list);
}
