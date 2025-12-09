import { defineStore } from "pinia";
import { UserState } from "@/stores/interface";
import { getInfo } from '@/api/modules/' // 通用的字典接口
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
    async userInit(){
      this.userInfo=await getInfo();
      console.log(this.userInfo);
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
