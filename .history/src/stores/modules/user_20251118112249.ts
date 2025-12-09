import { defineStore } from "pinia";
import { UserState } from "@/stores/interface";
import { getInfo } from '@/api/modules/mySystem/users' // 通用的字典接口
import piniaPersistConfig from "@/stores/helper/persist";

export const useUserStore = defineStore("user",{
  state: (): UserState => ({
    token: "",
    userInfo: { 
      id:0,
      name: "Geeker",
      roleId:0,
    }
  }),
  getters: {},
  actions: {
    async userInit() {
    // 1. 先从本地读取 token（如果开启了 persist 持久化，pinia 会自动同步，可省略这步）
    // 这里假设 persist 已经配置了 token 持久化，直接用 this.token 即可
    
    // 2. 如果有 token，才请求用户信息（避免未登录时调用接口）
    if (this.token) {
      try {
        const userInfo = await getInfo(); // 调用接口获取用户信息
        this.setUserInfo(userInfo.); // 用已有的 setUserInfo 方法更新
      } catch (error) {
        console.error("初始化用户信息失败：", error);
      }
    }
  },
    // Set Token
    setToken(token: string) {
      this.token = token;
    },
    // Set setUserInfo
    setUserInfo(userInfo: UserState["userInfo"]) {
      this.userInfo = userInfo;
    }
  },
  persist: piniaPersistConfig("geeker-user")
});
