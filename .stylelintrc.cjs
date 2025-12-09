// @see: https://stylelint.io

// module.exports = {
//   root: true,
//   // 继承某些已有的规则
//   /*
//   extends: [
//     "stylelint-config-standard", // 配置 stylelint 拓展插件
//     "stylelint-config-html/vue", // 配置 vue 中 template 样式格式化
//     "stylelint-config-standard-scss", // 配置 stylelint scss 插件
//     "stylelint-config-recommended-vue/scss", // 配置 vue 中 scss 样式格式化
//     "stylelint-config-recess-order" // 配置 stylelint css 属性书写顺序插件,
//   ],
//   */
//   overrides: [
//     // 扫描 .vue/html 文件中的 <style> 标签内的样式
//     {
//       files: ["**/*.{vue,html}"],
//       customSyntax: "postcss-html"
//     }
//   ],
//   rules: {
//     // 删除废弃的规则
//     // "scss/at-import-partial-extension": null,
    
//     "function-url-quotes": "always", // URL 的引号 "always(必须加上引号)"|"never(没有引号)"
//     "color-hex-length": "long", // 指定 16 进制颜色的简写或扩写 "short(16进制简写)"|"long(16进制扩写)"
//     "rule-empty-line-before": "never", // 要求或禁止在规则之前的空行 "always(规则之前必须始终有一个空行)"|"never(规则前绝不能有空行)"|"always-multi-line(多行规则之前必须始终有一个空行)"|"never-multi-line(多行规则之前绝不能有空行)"
//     "font-family-no-missing-generic-family-keyword": null, // 禁止在字体族名称列表中缺少通用字体族关键字
//     // "scss/at-import-partial-extension": null, // 解决不能使用 @import 引入 scss 文件
//     "property-no-unknown": null, // 禁止未知的属性
//     "no-empty-source": null, // 禁止空源码
//     "selector-class-pattern": null, // 强制选择器类名的格式
//     "value-no-vendor-prefix": null, // 关闭 vendor-prefix (为了解决多行省略 -webkit-box)
//     "no-descending-specificity": null, // 不允许较低特异性的选择器出现在覆盖较高特异性的选择器
//     "value-keyword-case": null, // 解决在 scss 中使用 v-bind 大写单词报错
//     "selector-pseudo-class-no-unknown": [
//       true,
//       {
//         ignorePseudoClasses: ["global", "v-deep", "deep"]
//       }
//     ]
//   },
//   ignoreFiles: ["**/*.js", "**/*.jsx", "**/*.tsx", "**/*.ts"]
// };
// @see: https://stylelint.io
// @see: https://stylelint.io
module.exports = {
  root: true,
  // 核心：删除/注释所有 extends（不继承任何预设规则）
  // extends: [], 
  // 仅保留文件解析配置（避免解析 Vue/HTML/SCSS 时报错）
  overrides: [
    {
      files: ["**/*.{vue,html}"],
      customSyntax: "postcss-html"
    },
    {
      files: ["**/*.{scss,sass}"],
      customSyntax: "postcss-scss"
    }
  ],
  // 自定义规则：全部设为 null/关闭，完全放开限制
  rules: {
    // ========== 基础规则：全部关闭 ==========
    "function-url-quotes": null, // 不限制 URL 引号
    "color-hex-length": null, // 不限制 16 进制颜色长度（#fff 或 #ffffff 都允许）
    "rule-empty-line-before": null, // 不限制规则前空行
    "font-family-no-missing-generic-family-keyword": null, // 不限制字体族关键字
    "property-no-unknown": null, // 允许任意自定义属性（如 --xxx）
    "no-empty-source": null, // 允许空样式文件
    "selector-class-pattern": null, // 不限制类名格式（任意命名都允许）
    "value-no-vendor-prefix": null, // 允许任意浏览器前缀
    "no-descending-specificity": null, // 不检测选择器优先级
    "value-keyword-case": null, // 不限制关键字大小写
    // ========== Vue 相关：仅保留解析，不限制规则 ==========
    "selector-pseudo-class-no-unknown": null, // 允许任意伪类（包括 v-deep/deep/global 等）
    // ========== 其他所有可能的限制规则：全部关闭 ==========
    "block-no-empty": null, // 允许空样式块
    "declaration-block-trailing-semicolon": null, // 不限制声明块末尾分号
    "indentation": null, // 不限制缩进（空格/制表符/任意长度都允许）
    "max-empty-lines": null, // 不限制空行数量
    "no-eol-whitespace": null, // 允许行尾空格
    "string-quotes": null, // 不限制字符串引号（单/双引号都允许）
    "unit-no-unknown": null, // 允许任意自定义单位
    "at-rule-no-unknown": null, // 允许任意自定义 @ 规则（如 @custom-rule）
    "selector-type-no-unknown": null, // 允许任意选择器类型
    "media-feature-name-no-unknown": null, // 允许任意媒体查询属性
    "comment-no-empty": null, // 允许空注释
    "no-duplicate-selectors": null, // 允许重复选择器
    "no-extra-semicolons": null, // 允许多余分号
    "no-invalid-double-slash-comments": null, // 允许双斜杠注释（即使在原生 CSS 中）
    "scss/at-rule-no-unknown": null, // 允许 SCSS 任意自定义 @ 规则
    "scss/no-duplicate-mixins": null, // 允许 SCSS 重复混入
    "scss/no-invalid-nesting": null // 允许 SCSS 任意嵌套方式
  },
  // 忽略更多文件，减少检测范围（进一步提升自由度）
  ignoreFiles: [
    "**/*.js",
    "**/*.jsx",
    "**/*.tsx",
    "**/*.ts",
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/*.min.css",
    "**/*.min.scss",
    "public/**/*", // 忽略 public 目录
    "assets/**/*.{css,scss}" // 可选：忽略静态资源目录（如需）
  ]
};