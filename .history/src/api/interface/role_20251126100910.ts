export interface Role {
  id: number;
  name: string;
  remark: string;
  status: string;
}

export interface RoleDTO {
  id: number;
  enabled: boolean;
  remark: string;
  status: string;
}
