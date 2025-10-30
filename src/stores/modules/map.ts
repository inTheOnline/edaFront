import { defineStore } from "pinia";
import { getIdMap } from "@/api/modules/cust";
import { rolesMap } from "@/api/modules/role";
import { userMap } from "@/api/modules/users";
import { getStateApi } from "@/api/modules/outgoing";
import { State } from "@/api/interface/outgoing";
import { User } from "@/api/interface/users";

// 定义 custMapData 的类型（假设是一个对象）
interface CustMapData {
  [key: string]: any; // 根据实际数据结构调整
}

export const useMapStore = defineStore({
  id: "mapStore",
  // 状态
  state: () => ({
    custMapData: {} as CustMapData, // 明确类型
    roleMapData: [] as any[], // 如果 Role 类型未定义，暂时用 any[]
    userMapData: [] as User[], // 明确类型
    stateMapData: [] as State[], // 明确类型
  }),
  // 动作
  actions: {
    async custMap() {
      try {
        const { data } = await getIdMap();
        this.custMapData = data;
      } catch (error) {
        console.error("Failed to fetch customer map data:", error);
        throw error; // 抛出错误以便调用方处理
      }
    },
    async roleMap() {
      try {
        const { data } = await rolesMap();
        this.roleMapData = data; // 移除 toRaw
      } catch (error) {
        console.error("Failed to fetch role map data:", error);
        throw error;
      }
    },
    async userMap() {
      try {
        const { data } = await userMap();
        this.userMapData = data;
      } catch (error) {
        console.error("Failed to fetch user map data:", error);
        throw error;
      }
    },
    async stateMap() {
      try {
        const { data } = await getStateApi();
        this.stateMapData = data;
      } catch (error) {
        console.error("Failed to fetch state map data:", error);
        throw error;
      }
    },
    // 获取用户映射数据（移除计数器逻辑）
    async getUserMap() {
      if (this.userMapData.length === 0) {
        await this.userMap(); // 确保数据已加载
      }
      return this.userMapData;
    },
    // 获取角色映射数据（移除计数器逻辑）
    async getRoleMap() {
      if (this.roleMapData.length === 0) {
        await this.roleMap(); // 确保数据已加载
      }
      return this.roleMapData;
    },
    // 获取客户映射数据（移除计数器逻辑）
    async getCustMap() {
      if (Object.keys(this.custMapData).length === 0) {
        await this.custMap(); // 确保数据已加载
      }
      return this.custMapData;
    },
    // 获取状态映射数据（移除计数器逻辑）
    async getStateMap() {
      if (this.stateMapData.length === 0) {
        await this.stateMap(); // 确保数据已加载
      }
      return this.stateMapData; // 修复：返回 stateMapData
    },
    // 初始化方法（使用 Promise.all 并行加载）
    async initialize() {
      try {
        await Promise.all([this.userMap(), this.custMap()]);
      } catch (error) {
        console.error("Failed to initialize map data:", error);
        throw error;
      }
    },
  },
});