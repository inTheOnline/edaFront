import { defineStore } from "pinia";
import { UserState } from "@/stores/interface";
import { getUserInfo } from '@/api/modules/dict' // 通用的字典接口
import piniaPersistConfig from "@/stores/helper/persist";

export const useUserStore = defineStore("user",{
  state: (): UserState => ({
    token: "",
    userInfo: { 
      id:0,
      name: "Geeker",
      roleId
    }
  }),
  getters: {},
  actions: {
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
