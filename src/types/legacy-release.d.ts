/**
 * v1.4发布兼容：旧抽屉组件在多个模块中使用同名结构但未声明类型。
 * 这里仅补齐公共形状，不改变运行时行为。
 */
interface DrawerProps {
  title?: string;
  isView?: boolean;
  row?: any;
  api?: (...args: any[]) => Promise<any>;
  getTableList?: (...args: any[]) => any;
  [key: string]: any;
}
