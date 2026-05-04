import { GodownTypeMap } from "@/enums/godownEnum";
import { computed } from "vue";
/**
 * @description：判断具体是哪种类型的出入库
 */
export const getTypeByFlow = function (type: string) {
    // 当item.label === type时取他的value
    const flow = GodownTypeMap.find(item => item.label === type)?.value;
    return flow;
}