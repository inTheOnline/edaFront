# PDF 盖章工具

## 功能

- 入口：基础管理首页 → 工具箱 → PDF 盖章 / 签名。
- 导入最大 30MB 的 PDF，选择公章或签名，添加到当前页，拖动定位后下载新 PDF。
- 公章使用透明版本：公章、财务章、工程章、合同章、品质章。签名为陈文浩。
- 圆章直径固定 4cm；椭圆长轴固定 4cm，短轴等比例；签名默认宽 2cm，可调整为 0.5-20cm，受页面大小约束。
- 同一页面可添加多个印迹，支持位置数值输入、方向键移动、删除、翻页和预览缩放。
- 骑缝章最多两组，各自选择公章、页码、左/右边缘和距顶部位置；页码支持 `1-5,8,10`，每组至少两页，允许不连续页。组内按页码升序分片，未选页不盖。
- 可上下拖动骑缝章；同组统一高度，位置受最小页面高度约束。组间独立，可覆盖相同页。
- 关闭或重新导入会清除位置，提供确认提示。下载不会覆盖原件。

## 技术实现与 API

- Vue 3 + Element Plus，单页图片预览，Pointer Events 拖拽；坐标统一使用物理 PDF point（1cm = 72/2.54 point）。
- `GET /base/seal/list`：返回印章名称、类别、比例、默认尺寸和透明 PNG data URL。
- `POST /base/seal/info`：multipart `file`，返回可视页面物理宽高。
- `POST /base/seal/preview`：multipart `file,page`，返回 PNG。页码从 1 开始。
- `POST /base/seal/export`：multipart `file,plan`，返回 PDF。plan 为 JSON：`{ marks: [{sealId,page,x,y,widthCm}], seams: [{sealId,pages,edge,y}] }`。
- 图片预览和 PDF 下载统一使用 `http.download`，处理 JSON Blob 业务错误，避免错误响应被保存为文件。
- 复用后端 PDFBox，不新增前端 PDF 依赖。后端请求期间读取 PDF，不持久化导入文件；切换页面重新提交当前文件，适用于当前 30MB 上传限制。

## 验证与注意事项

- 后端 `SealServiceTest` 验证尺寸、裁剪、0/90/180/270 度旋转、UserUnit、两组切片、签名缩放与输入校验。
- 前端整库类型检查存在旧模块错误；新增文件已单独检查 ESLint，并检查整库类型输出中无本功能错误。
- 独立浏览器测试连接实际盖章 Controller/Service，覆盖导入、拖拽、签名缩放、两组骑缝、无效页码、导出和翻页；此测试不代表正式服务已部署。
- 打印时选择实际大小/100%，预览缩放不改变导出物理尺寸。
- 章库位于后端 `{erp.file.root}/base/seals`，部署时须随文件根目录迁移。接口沿用现有 JWT 登录校验。
