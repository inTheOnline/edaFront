import router from "@/routers/index";
import { LOGIN_URL } from "@/config";
import { RouteRecordRaw } from "vue-router";
import { ElNotification } from "element-plus";
import { useUserStore } from "@/stores/modules/user";
import { useAuthStore } from "@/stores/modules/auth";
import { hasRoutePermission } from "@/utils";
import { getAiCapabilities } from "@/api/modules/ai";

// 引入 views 文件夹下所有 vue 文件
const modules = import.meta.glob("@/views/**/*.vue");

/**
 * @description 初始化动态路由
 */
export const initDynamicRouter = async () => {
  //引入 pinia下的userStore数据
  const userStore = useUserStore();
  const authStore = useAuthStore();

  try {
    // 1.获取菜单列表 && 按钮权限列表
    await authStore.getAuthMenuList();
    // await authStore.getAuthButtonList();
    //我加的，获取
    await authStore.getAuthInfo();

    // 入口按已验证的 ERP 身份展示；AI 尚未初始化时仍可进入查看原因，业务访问由后端校验。
    const token = userStore.token;
    authStore.aiCanUse = Number(authStore.userInfoGet.roleId) === 1 || authStore.userInfoGet.powers?.includes("ai:use") === true;
    try {
      const { data } = await getAiCapabilities(5000);
      authStore.aiCanUse = data.canUse === true;
    } catch (error) {
      const failure = error as { code?: string; response?: { status?: number } };
      if (["401", "403"].includes(String(failure.response?.status || failure.code))) authStore.aiCanUse = false;
    }
    if (token !== userStore.token) authStore.aiCanUse = false;
    if (authStore.aiCanUse && !authStore.flatMenuListGet.some(item => item.path === "/ai/assistant")) {
      authStore.authMenuList.push({
        id: -1, path: "/ai/assistant", name: "aiAssistant", component: "/ai/assistant/index",
        meta: { icon: "ChatDotRound", title: "AI 助手", isHide: false, isFull: false, isAffix: false, isKeepAlive: false, roles: "" }
      });
    }

    // 2.判断当前用户有没有菜单权限
    if (!authStore.authMenuListGet.length) {
      ElNotification({
        title: "无权限访问",
        message: "当前账号无任何菜单权限，请联系系统管理员！",
        type: "warning",
        duration: 3000
      });
      userStore.setToken("");
      router.replace(LOGIN_URL);
      return Promise.reject("No permission");
    }

    // 3.添加动态路由
    authStore.flatMenuListGet.forEach(item => {
      item.children && delete item.children;
      if (item.component && typeof item.component == "string") {
        item.component = modules["/src/views" + item.component + ".vue"];
      }
      // if (item.meta.isFull) {
      //   router.addRoute(item as unknown as RouteRecordRaw);
      // } else {
      //   router.addRoute("layout", item as unknown as RouteRecordRaw);
      // }
      //权限控制（我加的）
      if (item.meta.isFull && hasRoutePermission(item, authStore.userInfoGet.powers)) {
        router.addRoute(item as unknown as RouteRecordRaw);
      } else {
        if (hasRoutePermission(item, authStore.userInfoGet.powers)) {
          router.addRoute("layout", item as unknown as RouteRecordRaw);
        }
      }
    });
  } catch (error) {
    // 当按钮 || 菜单请求出错时，重定向到登陆页
    userStore.setToken("");
    router.replace(LOGIN_URL);
    return Promise.reject(error);
  }
};
