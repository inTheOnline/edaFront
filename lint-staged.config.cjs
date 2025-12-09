// module.exports = {
//   "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
//   "{!(package)*.json,*.code-snippets,.!(browserslist)*rc}": ["prettier --write--parser json"],
//   "package.json": ["prettier --write"],
//   "*.vue": ["eslint --fix", "prettier --write", "stylelint --fix"],
//   "*.{scss,less,styl,html}": ["stylelint --fix", "prettier --write"],
//   "*.md": ["prettier --write"]
// };
module.exports = {
  // JS/TS
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],

  // Vue 文件
  "*.vue": ["eslint --fix", "prettier --write", "stylelint --fix"],

  // 样式 & HTML
  "*.{scss,less,styl,html}": ["stylelint --fix", "prettier --write"],

  // JSON（含 package.json）
  "*.json": ["prettier --write"],

  // Markdown
  "*.md": ["prettier --write"],

  // 排除目录（务必加）
  "!**/node_modules/**": [],
  "!**/dist/**": [],
  "!**/build/**": [],
  "!**/public/**": [],
  "!**/mock/**": []
};

