import type { ColumnProps } from "@/components/ProTable/interface";
import { rolesMap } from "@/api/modules/system/role";
import { GenderMap } from "@/enums/baseEnum";
import { reactive } from "vue";
export const columns: ColumnProps[] = reactive([
  { type: "selection", label: "选择", prop: "id", align: "center" },
  {
    type: "index",
    label: "序号",
    width: 60,
    align: "center",
    fixed: "left",
    // 本次改动：该配置文件未接收表格实例，避免引用不存在的 proTableRef。
    index: index => index + 1,
  },
  {
    label: "用户名",
    prop: "userName",
    search: {
      el: "input",
      tooltip: "输入用户名称进行搜索",
      props: {
        prefixIcon: "search",
      },
    },
  },
  {
    label: "密码",
    prop: "password",
  },
  {
    label: "持有者",
    prop: "name",
    width: 200,
  },
  {
    label: "职位",
    prop: "roleId",
    width: 200,
    enum: rolesMap,
    tag: true,
    fieldNames: { label: "name", value: "id" },
  },
  {
    label: "性别",
    prop: "gender",
    enum: GenderMap,
    width: 100,
  },
  {
    label: "用户状态",
    prop: "userStatic",
    tag: true,
    width: 150,
  },
  {
    label: "备注",
    prop: "userNotes",
  },
  { prop: "operation", label: "操作", fixed: "right", width: 330 },
]);
