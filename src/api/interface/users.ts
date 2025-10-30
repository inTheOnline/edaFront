export interface User {
  id?: number;
  userName: string;
  password: string;
  name: string;
  gender: number;
  userStatus?: string;
  userNotes?: string;
  avatar?: string;
  roleId: number;
}
export interface PassWord{
  oldPass: string;
  newPass: string;  
  confirmPass: string;
}
