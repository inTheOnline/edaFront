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

    // 内置 AI 入口不依赖 menu/meta 迁移；能力不可用时不影响其他业务路由。
    authStore.aiCanUse = false;
    try {
      const token = userStore.token;
      const { data } = await getAiCapabilities(5000);
      authStore.aiCanUse = token === userStore.token && (data.canUse === true || data.admin === true);
    } catch { /* AI 尚未部署或暂不可用时保留既有 ERP 菜单。 */ }
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
