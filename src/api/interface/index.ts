// 请求响应参数（不包含data）
export interface Result {
  code: string;
  message: string;
}

// 请求响应参数（包含data）
export interface ResultData<T = any> extends Result {
  data: T;
}
export interface PageResult<T = any> extends Result {
  data: T[];
}
// 分页响应参数
export interface ResPage<T> {
  records: T[];
  pageNum: number;
  pageSize: number;
  total: number;
}


// 分页请求参数
export interface ReqPage {
  pageNum: number;
  pageSize: number;
}
export interface ReqPageT<T = any>extends ReqPage{
  data:T;
}

// 文件上传模块
export namespace Upload {
  export interface ResFileUrl {
    fileUrl: string;
  }
}

// 登录模块
export namespace Login {
  export interface ReqLoginForm {
    userName: string;
    password: string;
  }
  export interface ResLogin {
    token: string;
  }
  export interface ResAuthButtons {
    [key: string]: string[];
  }
  //用户信息模版(我加的)
  export interface ResUserInfo {
    userId: number;
    username: string;
    //姓名
    name: string;
    //性别
    gender: string;
    //用户状态
    userStatic: string;
    //用户备注
    userNotes: string;
    //用户头像
    avatar: string;
    power: string[];
  }
}

// 用户管理模块
export namespace User {
  export interface ReqUserParams extends ReqPage {
    username: string;
    gender: number;
    idCard: string;
    email: string;
    address: string;
    createTime: string[];
    status: number;
  }
  export interface ResUserList {
    id: string;
    username: string;
    gender: number;
    user: { detail: { age: number } };
    idCard: string;
    email: string;
    address: string;
    createTime: string;
    status: number;
    avatar: string;
    photo: any[];
    children?: ResUserList[];
  }
  export interface ResStatus {
    userLabel: string;
    userValue: number;
  }
  export interface ResGender {
    genderLabel: string;
    genderValue: number;
  }
  export interface ResDepartment {
    id: string;
    name: string;
    children?: ResDepartment[];
  }
  export interface ResRole {
    id: string;
    name: string;
    children?: ResDepartment[];
  }
}
