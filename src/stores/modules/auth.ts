import { defineStore } from "pinia";
import { AuthState } from "@/stores/interface";
import { getAuthButtonListApi, getAuthMenuListApi, getAuthInfoApi } from "@/api/modules/login";
import { getFlatMenuList, getShowMenuList, getAllBreadcrumbList } from "@/utils";
import { getDefaultInfoApi } from "@/api/modules/mySystem/users";

export const useAuthStore = defineStore({
  id: "geeker-auth",
  state: (): AuthState => ({
    // 按钮权限列表
    authButtonList: {},
    // 菜单权限列表
    authMenuList: [],
    //
    userInfo: {
      id: 0,
      userName: "",
      password: "",
      name: "",
      gender: 0,
      userStatic: "",
      userNotes: "",
      avatar: "",
      token: "",
      roleId: 0,
      powers: []
    },
    // 当前页面的 router name，用来做按钮权限筛选
    routeName: "",
    defaultInfo: {
      custId: 0,
    }
  }),
  getters: {
    // 按钮权限列表
    authButtonListGet: state => state.authButtonList,
    // 菜单权限列表 ==> 这里的菜单没有经过任何处理
    authMenuListGet: state => state.authMenuList,
    // 菜单权限列表 ==> 左侧菜单栏渲染，需要剔除 isHide == true
    showMenuListGet: state => getShowMenuList(state.authMenuList),
    // 菜单权限列表 ==> 扁平化之后的一维数组菜单，主要用来添加动态路由
    flatMenuListGet: state => getFlatMenuList(state.authMenuList),
    // 递归处理后的所有面包屑导航列表
    breadcrumbListGet: state => getAllBreadcrumbList(state.authMenuList),
    // 个人信息以及权限标识信息对象（我加的）
    userInfoGet: state => state.userInfo,
    // 默认配置信息（我加的）
    defaultInfoGet: state => state.defaultInfo
  },
  actions: {
    // Get AuthButtonList
    async getAuthButtonList() {
      const { data } = await getAuthButtonListApi();
      this.authButtonList = data;
    },
    // Get AuthMenuList
    async getAuthMenuList() {
      const { data } = await getAuthMenuListApi();
      //改动路由从静态变为数据库中获取
      this.authMenuList = data;
    },
    // Set RouteName
    async setRouteName(name: string) {
      this.routeName = name;
    },
    // Get UserInfo(我加的)
    async getAuthInfo() {
      const { data } = await getAuthInfoApi();
      this.userInfo = data;
      const { data: defaultInfoData } = await getDefaultInfoApi();
      this.defaultInfo.custId = defaultInfoData.custId;
    },
    // ✅ 新增：重置整个权限仓库（登出时调用）
    resetAuthStore() {
      // 重置为初始值
      this.$reset();
    },
    isExistence(name: string): boolean {
      return this.userInfo.powers?.includes(name);
    }
  }
});
