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
export const getRoles = () =>{
  return http.get<ReqPageT<Role>>("/power/getRolePower");
}
export const savePower= 
