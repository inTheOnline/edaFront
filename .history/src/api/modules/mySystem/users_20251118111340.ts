import http from "@/api";
import { User,PassWord } from "@/api/interface/users";
import { ReqPage,ResultData } from "@/api/interface/index";
import { c } from "naive-ui";
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
export const userMap = () =>{
  return http.get<ResultData<User[]>>("/user/map/name");
}
export const alterPass =(subData: PassWord ) =>{
  return http.post<any>("/user/alterPass", subData);
}
export const editUser =(user: User ) =>{
  return http.post<any>("/user/editUser", user);
}
export const getInfo = () => {
  return http.get<User[]>("/user/getUserInfo", params);
}