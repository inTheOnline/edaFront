import { Login } from "@/api/interface/index";
import { PORT1 } from "@/api/config/servicePort";
import authMenuList from "@/assets/json/authMenuList.json";
import authButtonList from "@/assets/json/authButtonList.json";
import http from "@/api";

/**
 * @name 登录模块
 */
// 用户登录
/*
参数规范如下
传入参数：ReqLoginForm {
  username: string;
  password: string;
}
登录的post返回类型：ResLogin {
  access_token: string;
}
  */
export const loginApi = (params: Login.ReqLoginForm) => {
  return http.post<Login.ResLogin>(`/web/login`, params, { loading: false }); // 正常 post json 请求  ==>  application/json
  // return http.post<Login.ResLogin>(PORT1 + `/login`, params, { loading: false }); // 控制当前请求不显示 loading
  // return http.post<Login.ResLogin>(PORT1 + `/login`, {}, { params }); // post 请求携带 query 参数  ==>  ?username=admin&password=123456
  // return http.post<Login.ResLogin>(PORT1 + `/login`, qs.stringify(params)); // post 请求携带表单参数  ==>  application/x-www-form-urlencoded
  // return http.get<Login.ResLogin>(PORT1 + `/login?${qs.stringify(params, { arrayFormat: "repeat" })}`); // get 请求可以携带数组等复杂参数
};

// 获取菜单列表
export const getAuthMenuListApi = () => {
  // return http.get<Menu.MenuOptions[]>(PORT1 + `/menu/list`, {}, { loading: false });
  return http.get<Menu.MenuOptions[]>('/menu/list', {})
    .catch(error => {
      console.error("请求失败:", error);  // 打印错误信息
      throw error;  // 重新抛出，让外层捕获
    });
  // 如果想让菜单变为本地数据，注释上一行代码，并引入本地 authMenuList.json 数据
  // return authMenuList;
};

// 获取按钮权限
export const getAuthButtonListApi = () => {
  return http.get<Login.ResAuthButtons>(PORT1 + `/auth/buttons`, {}, { loading: false });
  // 如果想让按钮权限变为本地数据，注释上一行代码，并引入本地 authButtonList.json 数据
  return authButtonList;
};

export const getAuthInfoApi = () => {
  //接口数据（我加的）
  return http.get<Login.ResUserInfo>(`/web/getInfo`, {  });
  //本地数据
  // return userInfo;
};

// 用户退出登录
export const logoutApi = () => {
  return http.post(`/web/unlogin`);
};
