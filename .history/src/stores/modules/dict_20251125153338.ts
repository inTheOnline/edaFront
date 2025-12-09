// stores/dict.ts
import { defineStore } from 'pinia'
import { getDictData } from '@/api/modules/system/dict' // 通用的字典接口
import { ref } from 'vue'

export const useDictStore = defineStore('dict', () => {
    const dictMap = ref<Record<string, { value: string | number; label: string }[]>>({})
    const abortControllers = ref<Record<string, AbortController>>({}) // 存储取消控制器
  
    const loadingStatus = ref<Record<string, boolean>>({}) // 加载状态

    const loadDict = async (type: string, options?: { force?: boolean }) => {
      if (!options?.force && dictMap.value[type]?.length) {
        return dictMap.value[type] // 如果已存在，直接返回缓存
      }

      if (loadingStatus.value[type]) {
        return new Promise((resolve, reject) => {
          const interval = setInterval(() => {
            if (!loadingStatus.value[type]) {
              clearInterval(interval)
              resolve(dictMap.value[type])
            }
          }, 50)
        })
      }

      if (abortControllers.value[type]) {
        abortControllers.value[type].abort()
      }

      const controller = new AbortController()
      abortControllers.value[type] = controller
      loadingStatus.value[type] = true

      try {
        const res = await getDictData(type, {
          signal: controller.signal,
        })
        dictMap.value[type] = res.data || []
        return dictMap.value[type]
      } catch (error: any) {
        if (error.name === 'CanceledError') {
          console.log(`[${type}] 请求被主动取消`)
          return
        }
        throw error
      } finally {
        delete abortControllers.value[type]
        loadingStatus.value[type] = false
      }
    }


    const getLabel = (type: string, value: string | number) => {
      const list = dictMap.value[type];
      if (!list || !Array.isArray(list)) return value;
      const item = list.find(item => String(item.value) === String(value));
      return item ? item.label : value;
    };
    

  const loadDicts = async (types: string[]) => {
    await Promise.all(types.map(loadDict))
  }

  return {
    dictMap,
    loadDict,
    getLabel,
    loadDicts
  }
})
