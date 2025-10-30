/**
 * v-auth
 * 按钮权限指令
 * 动态匹配，如果条件成立，就保留el，（el就是dom）,否则，就移除
 */
import { useAuthStore } from "@/stores/modules/auth";
import type { Directive, DirectiveBinding } from "vue";

// const auth: Directive = {
//   mounted(el: HTMLElement, binding: DirectiveBinding) {
//     const { value } = binding;
//     const authStore = useAuthStore();
//     const currentPageRoles = authStore.authButtonListGet[authStore.routeName] ?? [];
//     if (value instanceof Array && value.length) {
//       const hasPermission = value.every(item => currentPageRoles.includes(item));
//       if (!hasPermission) el.remove();
//     } else {
//       if (!currentPageRoles.includes(value)) el.remove();
//     }
//   }
// };
const auth: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const { value } = binding;
    const authStore = useAuthStore();
    const currentPageRoles = authStore.userInfoGet.powers ?? [];
    if (value instanceof Array && value.length) {
      const hasPermission = value.some(item => currentPageRoles.includes(item));
      if (!hasPermission) el.remove();
    } else {
      if (!currentPageRoles.includes(value)) el.remove();
    }
  }
};

export default auth;
