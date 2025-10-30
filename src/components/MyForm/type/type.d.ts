export interface FieldItem {
    label: string
    prop: string
    component?: string // el-input, el-select 等
    attrs?: Record<string, any> // placeholder、clearable等
  }
// @/components/MyForm/type/type.ts

// 表单项配置
export interface FormProps {
    prop: string
    label: string
    component?: string // 例如：'el-input', 'el-select'
    componentProps?: Record<string, any>
    required?: boolean
  }
  
  // 抽屉组件的配置
  export interface DrawerProps {
    title: string
    width?: string | number
    formItems: FormProps[]
    model: Record<string, any>
    api: (data: any) => Promise<any>
    idKey?: string
    label?: string
  }
    