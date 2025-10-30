import http from "@/api";
import { Project } from "@/api/interface/project";
import { ReqPage } from "@/api/interface/index";
export const getAllProject = (params: ReqPage) => {
  return http.get<Project[]>("/project/getAll", params);
}
export const addProject = (project: Project ) => {
  return http.post<any>("/project/add", project);
}
export const delectProjects = (ids: number[] ) => {
  return http.post<any>("/project/removes", ids);
}
export const getMaters = (id: number ) => {
  return http.post<any>("/project/getMasters/Byid", {id});
}
