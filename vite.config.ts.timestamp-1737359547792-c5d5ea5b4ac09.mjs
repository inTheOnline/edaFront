// vite.config.ts
import { defineConfig, loadEnv } from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/vite@5.4.5_@types+node@22.5.5_sass@1.78.0/node_modules/vite/dist/node/index.js";
import { resolve as resolve2 } from "path";

// build/getEnv.ts
function wrapperEnv(envConf) {
  const ret = {};
  for (const envName of Object.keys(envConf)) {
    let realName = envConf[envName].replace(/\\n/g, "\n");
    realName = realName === "true" ? true : realName === "false" ? false : realName;
    if (envName === "VITE_PORT") realName = Number(realName);
    if (envName === "VITE_PROXY") {
      try {
        realName = JSON.parse(realName);
      } catch (error) {
      }
    }
    ret[envName] = realName;
  }
  return ret;
}

// build/proxy.ts
function createProxy(list = []) {
  const ret = {};
  for (const [prefix, target] of list) {
    const httpsRE = /^https:\/\//;
    const isHttps = httpsRE.test(target);
    ret[prefix] = {
      target,
      changeOrigin: true,
      ws: true,
      rewrite: (path) => path.replace(new RegExp(`^${prefix}`), ""),
      // https is require secure=false
      ...isHttps ? { secure: false } : {}
    };
  }
  return ret;
}

// build/plugins.ts
import { resolve } from "path";
import { VitePWA } from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/vite-plugin-pwa@0.20.5_vite@5.4.5_workbox-build@7.1.1_workbox-window@7.1.0/node_modules/vite-plugin-pwa/dist/index.js";
import { createHtmlPlugin } from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/vite-plugin-html@3.2.2_vite@5.4.5/node_modules/vite-plugin-html/dist/index.mjs";
import { visualizer } from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/rollup-plugin-visualizer@5.12.0_rollup@2.79.1/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { createSvgIconsPlugin } from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/vite-plugin-svg-icons@2.0.1_vite@5.4.5/node_modules/vite-plugin-svg-icons/dist/index.mjs";
import vue from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/@vitejs+plugin-vue@5.1.3_vite@5.4.5_vue@3.5.5/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/@vitejs+plugin-vue-jsx@3.1.0_vite@5.4.5_vue@3.5.5/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import eslintPlugin from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/vite-plugin-eslint@1.8.1_eslint@8.57.0_vite@5.4.5/node_modules/vite-plugin-eslint/dist/index.mjs";
import viteCompression from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/vite-plugin-compression@0.5.1_vite@5.4.5/node_modules/vite-plugin-compression/dist/index.mjs";
import vueSetupExtend from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/unplugin-vue-setup-extend-plus@1.0.1/node_modules/unplugin-vue-setup-extend-plus/dist/vite.js";
import NextDevTools from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/vite-plugin-vue-devtools@7.4.5_rollup@2.79.1_vite@5.4.5_vue@3.5.5/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
import { codeInspectorPlugin } from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/code-inspector-plugin@0.16.1/node_modules/code-inspector-plugin/dist/index.mjs";
var createVitePlugins = (viteEnv) => {
  const { VITE_GLOB_APP_TITLE, VITE_REPORT, VITE_DEVTOOLS, VITE_PWA, VITE_CODEINSPECTOR } = viteEnv;
  return [
    vue(),
    // vue 可以使用 jsx/tsx 语法
    vueJsx(),
    // devTools
    VITE_DEVTOOLS && NextDevTools({ launchEditor: "code" }),
    // esLint 报错信息显示在浏览器界面上
    eslintPlugin(),
    // name 可以写在 script 标签上
    vueSetupExtend({}),
    // 创建打包压缩配置
    createCompression(viteEnv),
    // 注入变量到 html 文件
    createHtmlPlugin({
      minify: true,
      inject: {
        data: { title: VITE_GLOB_APP_TITLE }
      }
    }),
    // 使用 svg 图标
    createSvgIconsPlugin({
      iconDirs: [resolve(process.cwd(), "src/assets/icons")],
      symbolId: "icon-[dir]-[name]"
    }),
    // vitePWA
    VITE_PWA && createVitePwa(viteEnv),
    // 是否生成包预览，分析依赖包大小做优化处理
    VITE_REPORT && visualizer({ filename: "stats.html", gzipSize: true, brotliSize: true }),
    // 自动 IDE 并将光标定位到 DOM 对应的源代码位置。see: https://inspector.fe-dev.cn/guide/start.html
    VITE_CODEINSPECTOR && codeInspectorPlugin({
      bundler: "vite"
    })
  ];
};
var createCompression = (viteEnv) => {
  const { VITE_BUILD_COMPRESS = "none", VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE } = viteEnv;
  const compressList = VITE_BUILD_COMPRESS.split(",");
  const plugins = [];
  if (compressList.includes("gzip")) {
    plugins.push(
      viteCompression({
        ext: ".gz",
        algorithm: "gzip",
        deleteOriginFile: VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE
      })
    );
  }
  if (compressList.includes("brotli")) {
    plugins.push(
      viteCompression({
        ext: ".br",
        algorithm: "brotliCompress",
        deleteOriginFile: VITE_BUILD_COMPRESS_DELETE_ORIGIN_FILE
      })
    );
  }
  return plugins;
};
var createVitePwa = (viteEnv) => {
  const { VITE_GLOB_APP_TITLE } = viteEnv;
  return VitePWA({
    registerType: "autoUpdate",
    manifest: {
      name: VITE_GLOB_APP_TITLE,
      short_name: VITE_GLOB_APP_TITLE,
      theme_color: "#ffffff",
      icons: [
        {
          src: "/logo.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/logo.png",
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: "/logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    }
  });
};

// package.json
var package_default = {
  name: "geeker-admin",
  private: true,
  version: "1.2.0",
  type: "module",
  description: "geeker-admin open source management system",
  author: {
    name: "Geeker",
    email: "848130454@qq.com",
    url: "https://github.com/HalseySpicy"
  },
  license: "MIT",
  homepage: "https://github.com/HalseySpicy/Geeker-Admin",
  repository: {
    type: "git",
    url: "git@github.com:HalseySpicy/Geeker-Admin.git"
  },
  bugs: {
    url: "https://github.com/HalseySpicy/Geeker-Admin/issues"
  },
  scripts: {
    dev: "vite",
    serve: "vite",
    "build:dev": "vue-tsc && vite build --mode development",
    "build:test": "vue-tsc && vite build --mode test",
    "build:pro": "vue-tsc && vite build --mode production",
    "type:check": "vue-tsc --noEmit --skipLibCheck",
    preview: "pnpm build:dev && vite preview",
    "lint:eslint": "eslint --fix --ext .js,.ts,.vue ./src",
    "lint:prettier": 'prettier --write "src/**/*.{js,ts,json,tsx,css,less,scss,vue,html,md}"',
    "lint:stylelint": 'stylelint --cache --fix "**/*.{vue,less,postcss,css,scss}" --cache --cache-location node_modules/.cache/stylelint/',
    "lint:lint-staged": "lint-staged",
    prepare: "husky install",
    release: "standard-version",
    commit: "git add -A && czg && git push"
  },
  dependencies: {
    "@element-plus/icons-vue": "^2.3.1",
    "@vueuse/core": "^10.11.0",
    "@wangeditor/editor": "^5.1.23",
    "@wangeditor/editor-for-vue": "^5.1.12",
    axios: "^1.7.2",
    dayjs: "^1.11.11",
    "driver.js": "^1.3.1",
    echarts: "^5.5.1",
    "echarts-liquidfill": "^3.1.0",
    "element-plus": "^2.7.6",
    md5: "^2.3.0",
    mitt: "^3.0.1",
    nprogress: "^0.2.0",
    pinia: "^2.1.7",
    "pinia-plugin-persistedstate": "^3.2.1",
    qs: "^6.12.1",
    screenfull: "^6.0.2",
    sortablejs: "^1.15.2",
    vue: "^3.4.31",
    "vue-i18n": "^9.13.1",
    "vue-router": "^4.4.0",
    vuedraggable: "^4.1.0"
  },
  devDependencies: {
    "@commitlint/cli": "^18.4.3",
    "@commitlint/config-conventional": "^18.4.3",
    "@types/md5": "^2.3.5",
    "@types/nprogress": "^0.2.3",
    "@types/qs": "^6.9.15",
    "@types/sortablejs": "^1.15.8",
    "@typescript-eslint/eslint-plugin": "^7.14.1",
    "@typescript-eslint/parser": "^7.14.1",
    "@vitejs/plugin-vue": "^5.0.4",
    "@vitejs/plugin-vue-jsx": "^3.1.0",
    autoprefixer: "^10.4.19",
    "code-inspector-plugin": "^0.16.1",
    "cz-git": "1.9.2",
    czg: "^1.9.2",
    eslint: "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "eslint-plugin-vue": "^9.26.0",
    husky: "^9.0.11",
    "lint-staged": "^15.2.5",
    postcss: "^8.4.38",
    "postcss-html": "^1.7.0",
    prettier: "^3.3.2",
    "rollup-plugin-visualizer": "^5.12.0",
    sass: "^1.77.6",
    "standard-version": "^9.5.0",
    stylelint: "^16.6.1",
    "stylelint-config-html": "^1.1.0",
    "stylelint-config-recess-order": "^5.0.1",
    "stylelint-config-recommended-scss": "^14.0.0",
    "stylelint-config-recommended-vue": "^1.5.0",
    "stylelint-config-standard": "^36.0.0",
    "stylelint-config-standard-scss": "^13.1.0",
    typescript: "^5.5.2",
    "unplugin-vue-setup-extend-plus": "^1.0.1",
    vite: "^5.3.2",
    "vite-plugin-compression": "^0.5.1",
    "vite-plugin-eslint": "^1.8.1",
    "vite-plugin-html": "^3.2.2",
    "vite-plugin-pwa": "^0.20.0",
    "vite-plugin-svg-icons": "^2.0.1",
    "vite-plugin-vue-devtools": "^7.3.5",
    "vue-tsc": "^2.0.22"
  },
  engines: {
    node: ">=16.18.0"
  },
  browserslist: {
    production: [
      "> 1%",
      "not dead",
      "not op_mini all"
    ],
    development: [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  config: {
    commitizen: {
      path: "node_modules/cz-git"
    }
  }
};

// vite.config.ts
import dayjs from "file:///G:/workspace%20VS%20code/web_project_code/Geeker/Geeker-Admin/node_modules/.pnpm/dayjs@1.11.13/node_modules/dayjs/dayjs.min.js";
var __vite_injected_original_dirname = "G:\\workspace VS code\\web_project_code\\Geeker\\Geeker-Admin";
var { dependencies, devDependencies, name, version } = package_default;
var __APP_INFO__ = {
  pkg: { dependencies, devDependencies, name, version },
  lastBuildTime: dayjs().format("YYYY-MM-DD HH:mm:ss")
};
var vite_config_default = defineConfig(({ mode }) => {
  const root = process.cwd();
  const env = loadEnv(mode, root);
  const viteEnv = wrapperEnv(env);
  return {
    // 部署应用时的基本 URL
    base: viteEnv.VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias: {
        "@": resolve2(__vite_injected_original_dirname, "./src"),
        "vue-i18n": "vue-i18n/dist/vue-i18n.cjs.js"
      }
    },
    define: {
      __APP_INFO__: JSON.stringify(__APP_INFO__)
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/var.scss";`
        }
      }
    },
    server: {
      host: "0.0.0.0",
      port: viteEnv.VITE_PORT,
      open: viteEnv.VITE_OPEN,
      cors: true,
      // Load proxy configuration from .env.development
      proxy: createProxy(viteEnv.VITE_PROXY)
    },
    plugins: createVitePlugins(viteEnv),
    esbuild: {
      pure: viteEnv.VITE_DROP_CONSOLE ? ["console.log", "debugger"] : []
    },
    build: {
      outDir: "dist",
      minify: "esbuild",
      // esbuild 打包更快，但是不能去除 console.log，terser打包慢，但能去除 console.log
      // minify: "terser",
      // terserOptions: {
      // 	compress: {
      // 		drop_console: viteEnv.VITE_DROP_CONSOLE,
      // 		drop_debugger: true
      // 	}
      // },
      sourcemap: false,
      // 禁用 gzip 压缩大小报告，可略微减少打包时间
      reportCompressedSize: false,
      // 规定触发警告的 chunk 大小
      chunkSizeWarningLimit: 2e3,
      rollupOptions: {
        output: {
          // Static resource classification and packaging
          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAiYnVpbGQvZ2V0RW52LnRzIiwgImJ1aWxkL3Byb3h5LnRzIiwgImJ1aWxkL3BsdWdpbnMudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRzpcXFxcd29ya3NwYWNlIFZTIGNvZGVcXFxcd2ViX3Byb2plY3RfY29kZVxcXFxHZWVrZXJcXFxcR2Vla2VyLUFkbWluXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJHOlxcXFx3b3Jrc3BhY2UgVlMgY29kZVxcXFx3ZWJfcHJvamVjdF9jb2RlXFxcXEdlZWtlclxcXFxHZWVrZXItQWRtaW5cXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0c6L3dvcmtzcGFjZSUyMFZTJTIwY29kZS93ZWJfcHJvamVjdF9jb2RlL0dlZWtlci9HZWVrZXItQWRtaW4vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYsIENvbmZpZ0VudiwgVXNlckNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyB3cmFwcGVyRW52IH0gZnJvbSBcIi4vYnVpbGQvZ2V0RW52XCI7XHJcbmltcG9ydCB7IGNyZWF0ZVByb3h5IH0gZnJvbSBcIi4vYnVpbGQvcHJveHlcIjtcclxuaW1wb3J0IHsgY3JlYXRlVml0ZVBsdWdpbnMgfSBmcm9tIFwiLi9idWlsZC9wbHVnaW5zXCI7XHJcbmltcG9ydCBwa2cgZnJvbSBcIi4vcGFja2FnZS5qc29uXCI7XHJcbmltcG9ydCBkYXlqcyBmcm9tIFwiZGF5anNcIjtcclxuXHJcbmNvbnN0IHsgZGVwZW5kZW5jaWVzLCBkZXZEZXBlbmRlbmNpZXMsIG5hbWUsIHZlcnNpb24gfSA9IHBrZztcclxuY29uc3QgX19BUFBfSU5GT19fID0ge1xyXG4gIHBrZzogeyBkZXBlbmRlbmNpZXMsIGRldkRlcGVuZGVuY2llcywgbmFtZSwgdmVyc2lvbiB9LFxyXG4gIGxhc3RCdWlsZFRpbWU6IGRheWpzKCkuZm9ybWF0KFwiWVlZWS1NTS1ERCBISDptbTpzc1wiKVxyXG59O1xyXG5cclxuLy8gQHNlZTogaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfTogQ29uZmlnRW52KTogVXNlckNvbmZpZyA9PiB7XHJcbiAgY29uc3Qgcm9vdCA9IHByb2Nlc3MuY3dkKCk7XHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCByb290KTtcclxuICBjb25zdCB2aXRlRW52ID0gd3JhcHBlckVudihlbnYpO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgLy8gXHU5MEU4XHU3RjcyXHU1RTk0XHU3NTI4XHU2NUY2XHU3Njg0XHU1N0ZBXHU2NzJDIFVSTFxyXG4gICAgYmFzZTogdml0ZUVudi5WSVRFX1BVQkxJQ19QQVRILFxyXG4gICAgcm9vdCxcclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICBcIkBcIjogcmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICAgICAgXCJ2dWUtaTE4blwiOiBcInZ1ZS1pMThuL2Rpc3QvdnVlLWkxOG4uY2pzLmpzXCJcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGRlZmluZToge1xyXG4gICAgICBfX0FQUF9JTkZPX186IEpTT04uc3RyaW5naWZ5KF9fQVBQX0lORk9fXylcclxuICAgIH0sXHJcbiAgICBjc3M6IHtcclxuICAgICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xyXG4gICAgICAgIHNjc3M6IHtcclxuICAgICAgICAgIGFkZGl0aW9uYWxEYXRhOiBgQGltcG9ydCBcIkAvc3R5bGVzL3Zhci5zY3NzXCI7YFxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBob3N0OiBcIjAuMC4wLjBcIixcclxuICAgICAgcG9ydDogdml0ZUVudi5WSVRFX1BPUlQsXHJcbiAgICAgIG9wZW46IHZpdGVFbnYuVklURV9PUEVOLFxyXG4gICAgICBjb3JzOiB0cnVlLFxyXG4gICAgICAvLyBMb2FkIHByb3h5IGNvbmZpZ3VyYXRpb24gZnJvbSAuZW52LmRldmVsb3BtZW50XHJcbiAgICAgIHByb3h5OiBjcmVhdGVQcm94eSh2aXRlRW52LlZJVEVfUFJPWFkpXHJcbiAgICB9LFxyXG4gICAgcGx1Z2luczogY3JlYXRlVml0ZVBsdWdpbnModml0ZUVudiksXHJcbiAgICBlc2J1aWxkOiB7XHJcbiAgICAgIHB1cmU6IHZpdGVFbnYuVklURV9EUk9QX0NPTlNPTEUgPyBbXCJjb25zb2xlLmxvZ1wiLCBcImRlYnVnZ2VyXCJdIDogW11cclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICBvdXREaXI6IFwiZGlzdFwiLFxyXG4gICAgICBtaW5pZnk6IFwiZXNidWlsZFwiLFxyXG4gICAgICAvLyBlc2J1aWxkIFx1NjI1M1x1NTMwNVx1NjZGNFx1NUZFQlx1RkYwQ1x1NEY0Nlx1NjYyRlx1NEUwRFx1ODBGRFx1NTNCQlx1OTY2NCBjb25zb2xlLmxvZ1x1RkYwQ3RlcnNlclx1NjI1M1x1NTMwNVx1NjE2Mlx1RkYwQ1x1NEY0Nlx1ODBGRFx1NTNCQlx1OTY2NCBjb25zb2xlLmxvZ1xyXG4gICAgICAvLyBtaW5pZnk6IFwidGVyc2VyXCIsXHJcbiAgICAgIC8vIHRlcnNlck9wdGlvbnM6IHtcclxuICAgICAgLy8gXHRjb21wcmVzczoge1xyXG4gICAgICAvLyBcdFx0ZHJvcF9jb25zb2xlOiB2aXRlRW52LlZJVEVfRFJPUF9DT05TT0xFLFxyXG4gICAgICAvLyBcdFx0ZHJvcF9kZWJ1Z2dlcjogdHJ1ZVxyXG4gICAgICAvLyBcdH1cclxuICAgICAgLy8gfSxcclxuICAgICAgc291cmNlbWFwOiBmYWxzZSxcclxuICAgICAgLy8gXHU3OTgxXHU3NTI4IGd6aXAgXHU1MzhCXHU3RjI5XHU1OTI3XHU1QzBGXHU2MkE1XHU1NDRBXHVGRjBDXHU1M0VGXHU3NTY1XHU1RkFFXHU1MUNGXHU1QzExXHU2MjUzXHU1MzA1XHU2NUY2XHU5NUY0XHJcbiAgICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcclxuICAgICAgLy8gXHU4OUM0XHU1QjlBXHU4OUU2XHU1M0QxXHU4QjY2XHU1NDRBXHU3Njg0IGNodW5rIFx1NTkyN1x1NUMwRlxyXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDIwMDAsXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIC8vIFN0YXRpYyByZXNvdXJjZSBjbGFzc2lmaWNhdGlvbiBhbmQgcGFja2FnaW5nXHJcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogXCJhc3NldHMvanMvW25hbWVdLVtoYXNoXS5qc1wiLFxyXG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6IFwiYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanNcIixcclxuICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiBcImFzc2V0cy9bZXh0XS9bbmFtZV0tW2hhc2hdLltleHRdXCJcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG59KTtcclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJHOlxcXFx3b3Jrc3BhY2UgVlMgY29kZVxcXFx3ZWJfcHJvamVjdF9jb2RlXFxcXEdlZWtlclxcXFxHZWVrZXItQWRtaW5cXFxcYnVpbGRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkc6XFxcXHdvcmtzcGFjZSBWUyBjb2RlXFxcXHdlYl9wcm9qZWN0X2NvZGVcXFxcR2Vla2VyXFxcXEdlZWtlci1BZG1pblxcXFxidWlsZFxcXFxnZXRFbnYudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0c6L3dvcmtzcGFjZSUyMFZTJTIwY29kZS93ZWJfcHJvamVjdF9jb2RlL0dlZWtlci9HZWVrZXItQWRtaW4vYnVpbGQvZ2V0RW52LnRzXCI7aW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc0RldkZuKG1vZGU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gIHJldHVybiBtb2RlID09PSBcImRldmVsb3BtZW50XCI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1Byb2RGbihtb2RlOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICByZXR1cm4gbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCI7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc1Rlc3RGbihtb2RlOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICByZXR1cm4gbW9kZSA9PT0gXCJ0ZXN0XCI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBXaGV0aGVyIHRvIGdlbmVyYXRlIHBhY2thZ2UgcHJldmlld1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGlzUmVwb3J0TW9kZSgpOiBib29sZWFuIHtcclxuICByZXR1cm4gcHJvY2Vzcy5lbnYuVklURV9SRVBPUlQgPT09IFwidHJ1ZVwiO1xyXG59XHJcblxyXG4vLyBSZWFkIGFsbCBlbnZpcm9ubWVudCB2YXJpYWJsZSBjb25maWd1cmF0aW9uIGZpbGVzIHRvIHByb2Nlc3MuZW52XHJcbmV4cG9ydCBmdW5jdGlvbiB3cmFwcGVyRW52KGVudkNvbmY6IFJlY29yZGFibGUpOiBWaXRlRW52IHtcclxuICBjb25zdCByZXQ6IGFueSA9IHt9O1xyXG5cclxuICBmb3IgKGNvbnN0IGVudk5hbWUgb2YgT2JqZWN0LmtleXMoZW52Q29uZikpIHtcclxuICAgIGxldCByZWFsTmFtZSA9IGVudkNvbmZbZW52TmFtZV0ucmVwbGFjZSgvXFxcXG4vZywgXCJcXG5cIik7XHJcbiAgICByZWFsTmFtZSA9IHJlYWxOYW1lID09PSBcInRydWVcIiA/IHRydWUgOiByZWFsTmFtZSA9PT0gXCJmYWxzZVwiID8gZmFsc2UgOiByZWFsTmFtZTtcclxuICAgIGlmIChlbnZOYW1lID09PSBcIlZJVEVfUE9SVFwiKSByZWFsTmFtZSA9IE51bWJlcihyZWFsTmFtZSk7XHJcbiAgICBpZiAoZW52TmFtZSA9PT0gXCJWSVRFX1BST1hZXCIpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICByZWFsTmFtZSA9IEpTT04ucGFyc2UocmVhbE5hbWUpO1xyXG4gICAgICB9IGNhdGNoIChlcnJvcikge31cclxuICAgIH1cclxuICAgIHJldFtlbnZOYW1lXSA9IHJlYWxOYW1lO1xyXG4gIH1cclxuICByZXR1cm4gcmV0O1xyXG59XHJcblxyXG4vKipcclxuICogR2V0IHVzZXIgcm9vdCBkaXJlY3RvcnlcclxuICogQHBhcmFtIGRpciBmaWxlIHBhdGhcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290UGF0aCguLi5kaXI6IHN0cmluZ1tdKSB7XHJcbiAgcmV0dXJuIHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAuLi5kaXIpO1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRzpcXFxcd29ya3NwYWNlIFZTIGNvZGVcXFxcd2ViX3Byb2plY3RfY29kZVxcXFxHZWVrZXJcXFxcR2Vla2VyLUFkbWluXFxcXGJ1aWxkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJHOlxcXFx3b3Jrc3BhY2UgVlMgY29kZVxcXFx3ZWJfcHJvamVjdF9jb2RlXFxcXEdlZWtlclxcXFxHZWVrZXItQWRtaW5cXFxcYnVpbGRcXFxccHJveHkudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0c6L3dvcmtzcGFjZSUyMFZTJTIwY29kZS93ZWJfcHJvamVjdF9jb2RlL0dlZWtlci9HZWVrZXItQWRtaW4vYnVpbGQvcHJveHkudHNcIjtpbXBvcnQgdHlwZSB7IFByb3h5T3B0aW9ucyB9IGZyb20gXCJ2aXRlXCI7XHJcblxyXG50eXBlIFByb3h5SXRlbSA9IFtzdHJpbmcsIHN0cmluZ107XHJcblxyXG50eXBlIFByb3h5TGlzdCA9IFByb3h5SXRlbVtdO1xyXG5cclxudHlwZSBQcm94eVRhcmdldExpc3QgPSBSZWNvcmQ8c3RyaW5nLCBQcm94eU9wdGlvbnM+O1xyXG5cclxuLyoqXHJcbiAqIFx1NTIxQlx1NUVGQVx1NEVFM1x1NzQwNlx1RkYwQ1x1NzUyOFx1NEU4RVx1ODlFM1x1Njc5MCAuZW52LmRldmVsb3BtZW50IFx1NEVFM1x1NzQwNlx1OTE0RFx1N0Y2RVxyXG4gKiBAcGFyYW0gbGlzdFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVByb3h5KGxpc3Q6IFByb3h5TGlzdCA9IFtdKSB7XHJcbiAgY29uc3QgcmV0OiBQcm94eVRhcmdldExpc3QgPSB7fTtcclxuICBmb3IgKGNvbnN0IFtwcmVmaXgsIHRhcmdldF0gb2YgbGlzdCkge1xyXG4gICAgY29uc3QgaHR0cHNSRSA9IC9eaHR0cHM6XFwvXFwvLztcclxuICAgIGNvbnN0IGlzSHR0cHMgPSBodHRwc1JFLnRlc3QodGFyZ2V0KTtcclxuXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaHR0cC1wYXJ0eS9ub2RlLWh0dHAtcHJveHkjb3B0aW9uc1xyXG4gICAgcmV0W3ByZWZpeF0gPSB7XHJcbiAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgIHdzOiB0cnVlLFxyXG4gICAgICByZXdyaXRlOiBwYXRoID0+IHBhdGgucmVwbGFjZShuZXcgUmVnRXhwKGBeJHtwcmVmaXh9YCksIFwiXCIpLFxyXG4gICAgICAvLyBodHRwcyBpcyByZXF1aXJlIHNlY3VyZT1mYWxzZVxyXG4gICAgICAuLi4oaXNIdHRwcyA/IHsgc2VjdXJlOiBmYWxzZSB9IDoge30pXHJcbiAgICB9O1xyXG4gIH1cclxuICByZXR1cm4gcmV0O1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRzpcXFxcd29ya3NwYWNlIFZTIGNvZGVcXFxcd2ViX3Byb2plY3RfY29kZVxcXFxHZWVrZXJcXFxcR2Vla2VyLUFkbWluXFxcXGJ1aWxkXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJHOlxcXFx3b3Jrc3BhY2UgVlMgY29kZVxcXFx3ZWJfcHJvamVjdF9jb2RlXFxcXEdlZWtlclxcXFxHZWVrZXItQWRtaW5cXFxcYnVpbGRcXFxccGx1Z2lucy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRzovd29ya3NwYWNlJTIwVlMlMjBjb2RlL3dlYl9wcm9qZWN0X2NvZGUvR2Vla2VyL0dlZWtlci1BZG1pbi9idWlsZC9wbHVnaW5zLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gXCJwYXRoXCI7XHJcbmltcG9ydCB7IFBsdWdpbk9wdGlvbiB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcbmltcG9ydCB7IGNyZWF0ZUh0bWxQbHVnaW4gfSBmcm9tIFwidml0ZS1wbHVnaW4taHRtbFwiO1xyXG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSBcInJvbGx1cC1wbHVnaW4tdmlzdWFsaXplclwiO1xyXG5pbXBvcnQgeyBjcmVhdGVTdmdJY29uc1BsdWdpbiB9IGZyb20gXCJ2aXRlLXBsdWdpbi1zdmctaWNvbnNcIjtcclxuaW1wb3J0IHZ1ZSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI7XHJcbmltcG9ydCB2dWVKc3ggZnJvbSBcIkB2aXRlanMvcGx1Z2luLXZ1ZS1qc3hcIjtcclxuaW1wb3J0IGVzbGludFBsdWdpbiBmcm9tIFwidml0ZS1wbHVnaW4tZXNsaW50XCI7XHJcbmltcG9ydCB2aXRlQ29tcHJlc3Npb24gZnJvbSBcInZpdGUtcGx1Z2luLWNvbXByZXNzaW9uXCI7XHJcbmltcG9ydCB2dWVTZXR1cEV4dGVuZCBmcm9tIFwidW5wbHVnaW4tdnVlLXNldHVwLWV4dGVuZC1wbHVzL3ZpdGVcIjtcclxuaW1wb3J0IE5leHREZXZUb29scyBmcm9tIFwidml0ZS1wbHVnaW4tdnVlLWRldnRvb2xzXCI7XHJcbmltcG9ydCB7IGNvZGVJbnNwZWN0b3JQbHVnaW4gfSBmcm9tIFwiY29kZS1pbnNwZWN0b3ItcGx1Z2luXCI7XHJcblxyXG4vKipcclxuICogXHU1MjFCXHU1RUZBIHZpdGUgXHU2M0QyXHU0RUY2XHJcbiAqIEBwYXJhbSB2aXRlRW52XHJcbiAqL1xyXG5leHBvcnQgY29uc3QgY3JlYXRlVml0ZVBsdWdpbnMgPSAodml0ZUVudjogVml0ZUVudik6IChQbHVnaW5PcHRpb24gfCBQbHVnaW5PcHRpb25bXSlbXSA9PiB7XHJcbiAgY29uc3QgeyBWSVRFX0dMT0JfQVBQX1RJVExFLCBWSVRFX1JFUE9SVCwgVklURV9ERVZUT09MUywgVklURV9QV0EsIFZJVEVfQ09ERUlOU1BFQ1RPUiB9ID0gdml0ZUVudjtcclxuICByZXR1cm4gW1xyXG4gICAgdnVlKCksXHJcbiAgICAvLyB2dWUgXHU1M0VGXHU0RUU1XHU0RjdGXHU3NTI4IGpzeC90c3ggXHU4QkVEXHU2Q0Q1XHJcbiAgICB2dWVKc3goKSxcclxuICAgIC8vIGRldlRvb2xzXHJcbiAgICBWSVRFX0RFVlRPT0xTICYmIE5leHREZXZUb29scyh7IGxhdW5jaEVkaXRvcjogXCJjb2RlXCIgfSksXHJcbiAgICAvLyBlc0xpbnQgXHU2MkE1XHU5NTE5XHU0RkUxXHU2MDZGXHU2NjNFXHU3OTNBXHU1NzI4XHU2RDRGXHU4OUM4XHU1NjY4XHU3NTRDXHU5NzYyXHU0RTBBXHJcbiAgICBlc2xpbnRQbHVnaW4oKSxcclxuICAgIC8vIG5hbWUgXHU1M0VGXHU0RUU1XHU1MTk5XHU1NzI4IHNjcmlwdCBcdTY4MDdcdTdCN0VcdTRFMEFcclxuICAgIHZ1ZVNldHVwRXh0ZW5kKHt9KSxcclxuICAgIC8vIFx1NTIxQlx1NUVGQVx1NjI1M1x1NTMwNVx1NTM4Qlx1N0YyOVx1OTE0RFx1N0Y2RVxyXG4gICAgY3JlYXRlQ29tcHJlc3Npb24odml0ZUVudiksXHJcbiAgICAvLyBcdTZDRThcdTUxNjVcdTUzRDhcdTkxQ0ZcdTUyMzAgaHRtbCBcdTY1ODdcdTRFRjZcclxuICAgIGNyZWF0ZUh0bWxQbHVnaW4oe1xyXG4gICAgICBtaW5pZnk6IHRydWUsXHJcbiAgICAgIGluamVjdDoge1xyXG4gICAgICAgIGRhdGE6IHsgdGl0bGU6IFZJVEVfR0xPQl9BUFBfVElUTEUgfVxyXG4gICAgICB9XHJcbiAgICB9KSxcclxuICAgIC8vIFx1NEY3Rlx1NzUyOCBzdmcgXHU1NkZFXHU2ODA3XHJcbiAgICBjcmVhdGVTdmdJY29uc1BsdWdpbih7XHJcbiAgICAgIGljb25EaXJzOiBbcmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCBcInNyYy9hc3NldHMvaWNvbnNcIildLFxyXG4gICAgICBzeW1ib2xJZDogXCJpY29uLVtkaXJdLVtuYW1lXVwiXHJcbiAgICB9KSxcclxuICAgIC8vIHZpdGVQV0FcclxuICAgIFZJVEVfUFdBICYmIGNyZWF0ZVZpdGVQd2Eodml0ZUVudiksXHJcbiAgICAvLyBcdTY2MkZcdTU0MjZcdTc1MUZcdTYyMTBcdTUzMDVcdTk4ODRcdTg5QzhcdUZGMENcdTUyMDZcdTY3OTBcdTRGOURcdThENTZcdTUzMDVcdTU5MjdcdTVDMEZcdTUwNUFcdTRGMThcdTUzMTZcdTU5MDRcdTc0MDZcclxuICAgIFZJVEVfUkVQT1JUICYmICh2aXN1YWxpemVyKHsgZmlsZW5hbWU6IFwic3RhdHMuaHRtbFwiLCBnemlwU2l6ZTogdHJ1ZSwgYnJvdGxpU2l6ZTogdHJ1ZSB9KSBhcyBQbHVnaW5PcHRpb24pLFxyXG4gICAgLy8gXHU4MUVBXHU1MkE4IElERSBcdTVFNzZcdTVDMDZcdTUxNDlcdTY4MDdcdTVCOUFcdTRGNERcdTUyMzAgRE9NIFx1NUJGOVx1NUU5NFx1NzY4NFx1NkU5MFx1NEVFM1x1NzgwMVx1NEY0RFx1N0Y2RVx1MzAwMnNlZTogaHR0cHM6Ly9pbnNwZWN0b3IuZmUtZGV2LmNuL2d1aWRlL3N0YXJ0Lmh0bWxcclxuICAgIFZJVEVfQ09ERUlOU1BFQ1RPUiAmJlxyXG4gICAgICBjb2RlSW5zcGVjdG9yUGx1Z2luKHtcclxuICAgICAgICBidW5kbGVyOiBcInZpdGVcIlxyXG4gICAgICB9KVxyXG4gIF07XHJcbn07XHJcblxyXG4vKipcclxuICogQGRlc2NyaXB0aW9uIFx1NjgzOVx1NjM2RSBjb21wcmVzcyBcdTkxNERcdTdGNkVcdUZGMENcdTc1MUZcdTYyMTBcdTRFMERcdTU0MENcdTc2ODRcdTUzOEJcdTdGMjlcdTg5QzRcdTUyMTlcclxuICogQHBhcmFtIHZpdGVFbnZcclxuICovXHJcbmNvbnN0IGNyZWF0ZUNvbXByZXNzaW9uID0gKHZpdGVFbnY6IFZpdGVFbnYpOiBQbHVnaW5PcHRpb24gfCBQbHVnaW5PcHRpb25bXSA9PiB7XHJcbiAgY29uc3QgeyBWSVRFX0JVSUxEX0NPTVBSRVNTID0gXCJub25lXCIsIFZJVEVfQlVJTERfQ09NUFJFU1NfREVMRVRFX09SSUdJTl9GSUxFIH0gPSB2aXRlRW52O1xyXG4gIGNvbnN0IGNvbXByZXNzTGlzdCA9IFZJVEVfQlVJTERfQ09NUFJFU1Muc3BsaXQoXCIsXCIpO1xyXG4gIGNvbnN0IHBsdWdpbnM6IFBsdWdpbk9wdGlvbltdID0gW107XHJcbiAgaWYgKGNvbXByZXNzTGlzdC5pbmNsdWRlcyhcImd6aXBcIikpIHtcclxuICAgIHBsdWdpbnMucHVzaChcclxuICAgICAgdml0ZUNvbXByZXNzaW9uKHtcclxuICAgICAgICBleHQ6IFwiLmd6XCIsXHJcbiAgICAgICAgYWxnb3JpdGhtOiBcImd6aXBcIixcclxuICAgICAgICBkZWxldGVPcmlnaW5GaWxlOiBWSVRFX0JVSUxEX0NPTVBSRVNTX0RFTEVURV9PUklHSU5fRklMRVxyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcbiAgaWYgKGNvbXByZXNzTGlzdC5pbmNsdWRlcyhcImJyb3RsaVwiKSkge1xyXG4gICAgcGx1Z2lucy5wdXNoKFxyXG4gICAgICB2aXRlQ29tcHJlc3Npb24oe1xyXG4gICAgICAgIGV4dDogXCIuYnJcIixcclxuICAgICAgICBhbGdvcml0aG06IFwiYnJvdGxpQ29tcHJlc3NcIixcclxuICAgICAgICBkZWxldGVPcmlnaW5GaWxlOiBWSVRFX0JVSUxEX0NPTVBSRVNTX0RFTEVURV9PUklHSU5fRklMRVxyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcbiAgcmV0dXJuIHBsdWdpbnM7XHJcbn07XHJcblxyXG4vKipcclxuICogQGRlc2NyaXB0aW9uIFZpdGVQd2FcclxuICogQHBhcmFtIHZpdGVFbnZcclxuICovXHJcbmNvbnN0IGNyZWF0ZVZpdGVQd2EgPSAodml0ZUVudjogVml0ZUVudik6IFBsdWdpbk9wdGlvbiB8IFBsdWdpbk9wdGlvbltdID0+IHtcclxuICBjb25zdCB7IFZJVEVfR0xPQl9BUFBfVElUTEUgfSA9IHZpdGVFbnY7XHJcbiAgcmV0dXJuIFZpdGVQV0Eoe1xyXG4gICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcclxuICAgIG1hbmlmZXN0OiB7XHJcbiAgICAgIG5hbWU6IFZJVEVfR0xPQl9BUFBfVElUTEUsXHJcbiAgICAgIHNob3J0X25hbWU6IFZJVEVfR0xPQl9BUFBfVElUTEUsXHJcbiAgICAgIHRoZW1lX2NvbG9yOiBcIiNmZmZmZmZcIixcclxuICAgICAgaWNvbnM6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICBzcmM6IFwiL2xvZ28ucG5nXCIsXHJcbiAgICAgICAgICBzaXplczogXCIxOTJ4MTkyXCIsXHJcbiAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBzcmM6IFwiL2xvZ28ucG5nXCIsXHJcbiAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXHJcbiAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBzcmM6IFwiL2xvZ28ucG5nXCIsXHJcbiAgICAgICAgICBzaXplczogXCI1MTJ4NTEyXCIsXHJcbiAgICAgICAgICB0eXBlOiBcImltYWdlL3BuZ1wiLFxyXG4gICAgICAgICAgcHVycG9zZTogXCJhbnkgbWFza2FibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgXVxyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG4iLCAie1xuICBcIm5hbWVcIjogXCJnZWVrZXItYWRtaW5cIixcbiAgXCJwcml2YXRlXCI6IHRydWUsXG4gIFwidmVyc2lvblwiOiBcIjEuMi4wXCIsXG4gIFwidHlwZVwiOiBcIm1vZHVsZVwiLFxuICBcImRlc2NyaXB0aW9uXCI6IFwiZ2Vla2VyLWFkbWluIG9wZW4gc291cmNlIG1hbmFnZW1lbnQgc3lzdGVtXCIsXG4gIFwiYXV0aG9yXCI6IHtcbiAgICBcIm5hbWVcIjogXCJHZWVrZXJcIixcbiAgICBcImVtYWlsXCI6IFwiODQ4MTMwNDU0QHFxLmNvbVwiLFxuICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL0hhbHNleVNwaWN5XCJcbiAgfSxcbiAgXCJsaWNlbnNlXCI6IFwiTUlUXCIsXG4gIFwiaG9tZXBhZ2VcIjogXCJodHRwczovL2dpdGh1Yi5jb20vSGFsc2V5U3BpY3kvR2Vla2VyLUFkbWluXCIsXG4gIFwicmVwb3NpdG9yeVwiOiB7XG4gICAgXCJ0eXBlXCI6IFwiZ2l0XCIsXG4gICAgXCJ1cmxcIjogXCJnaXRAZ2l0aHViLmNvbTpIYWxzZXlTcGljeS9HZWVrZXItQWRtaW4uZ2l0XCJcbiAgfSxcbiAgXCJidWdzXCI6IHtcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9IYWxzZXlTcGljeS9HZWVrZXItQWRtaW4vaXNzdWVzXCJcbiAgfSxcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImRldlwiOiBcInZpdGVcIixcbiAgICBcInNlcnZlXCI6IFwidml0ZVwiLFxuICAgIFwiYnVpbGQ6ZGV2XCI6IFwidnVlLXRzYyAmJiB2aXRlIGJ1aWxkIC0tbW9kZSBkZXZlbG9wbWVudFwiLFxuICAgIFwiYnVpbGQ6dGVzdFwiOiBcInZ1ZS10c2MgJiYgdml0ZSBidWlsZCAtLW1vZGUgdGVzdFwiLFxuICAgIFwiYnVpbGQ6cHJvXCI6IFwidnVlLXRzYyAmJiB2aXRlIGJ1aWxkIC0tbW9kZSBwcm9kdWN0aW9uXCIsXG4gICAgXCJ0eXBlOmNoZWNrXCI6IFwidnVlLXRzYyAtLW5vRW1pdCAtLXNraXBMaWJDaGVja1wiLFxuICAgIFwicHJldmlld1wiOiBcInBucG0gYnVpbGQ6ZGV2ICYmIHZpdGUgcHJldmlld1wiLFxuICAgIFwibGludDplc2xpbnRcIjogXCJlc2xpbnQgLS1maXggLS1leHQgLmpzLC50cywudnVlIC4vc3JjXCIsXG4gICAgXCJsaW50OnByZXR0aWVyXCI6IFwicHJldHRpZXIgLS13cml0ZSBcXFwic3JjLyoqLyoue2pzLHRzLGpzb24sdHN4LGNzcyxsZXNzLHNjc3MsdnVlLGh0bWwsbWR9XFxcIlwiLFxuICAgIFwibGludDpzdHlsZWxpbnRcIjogXCJzdHlsZWxpbnQgLS1jYWNoZSAtLWZpeCBcXFwiKiovKi57dnVlLGxlc3MscG9zdGNzcyxjc3Msc2Nzc31cXFwiIC0tY2FjaGUgLS1jYWNoZS1sb2NhdGlvbiBub2RlX21vZHVsZXMvLmNhY2hlL3N0eWxlbGludC9cIixcbiAgICBcImxpbnQ6bGludC1zdGFnZWRcIjogXCJsaW50LXN0YWdlZFwiLFxuICAgIFwicHJlcGFyZVwiOiBcImh1c2t5IGluc3RhbGxcIixcbiAgICBcInJlbGVhc2VcIjogXCJzdGFuZGFyZC12ZXJzaW9uXCIsXG4gICAgXCJjb21taXRcIjogXCJnaXQgYWRkIC1BICYmIGN6ZyAmJiBnaXQgcHVzaFwiXG4gIH0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBlbGVtZW50LXBsdXMvaWNvbnMtdnVlXCI6IFwiXjIuMy4xXCIsXG4gICAgXCJAdnVldXNlL2NvcmVcIjogXCJeMTAuMTEuMFwiLFxuICAgIFwiQHdhbmdlZGl0b3IvZWRpdG9yXCI6IFwiXjUuMS4yM1wiLFxuICAgIFwiQHdhbmdlZGl0b3IvZWRpdG9yLWZvci12dWVcIjogXCJeNS4xLjEyXCIsXG4gICAgXCJheGlvc1wiOiBcIl4xLjcuMlwiLFxuICAgIFwiZGF5anNcIjogXCJeMS4xMS4xMVwiLFxuICAgIFwiZHJpdmVyLmpzXCI6IFwiXjEuMy4xXCIsXG4gICAgXCJlY2hhcnRzXCI6IFwiXjUuNS4xXCIsXG4gICAgXCJlY2hhcnRzLWxpcXVpZGZpbGxcIjogXCJeMy4xLjBcIixcbiAgICBcImVsZW1lbnQtcGx1c1wiOiBcIl4yLjcuNlwiLCBcbiAgICBcIm1kNVwiOiBcIl4yLjMuMFwiLFxuICAgIFwibWl0dFwiOiBcIl4zLjAuMVwiLFxuICAgIFwibnByb2dyZXNzXCI6IFwiXjAuMi4wXCIsXG4gICAgXCJwaW5pYVwiOiBcIl4yLjEuN1wiLFxuICAgIFwicGluaWEtcGx1Z2luLXBlcnNpc3RlZHN0YXRlXCI6IFwiXjMuMi4xXCIsXG4gICAgXCJxc1wiOiBcIl42LjEyLjFcIixcbiAgICBcInNjcmVlbmZ1bGxcIjogXCJeNi4wLjJcIixcbiAgICBcInNvcnRhYmxlanNcIjogXCJeMS4xNS4yXCIsXG4gICAgXCJ2dWVcIjogXCJeMy40LjMxXCIsXG4gICAgXCJ2dWUtaTE4blwiOiBcIl45LjEzLjFcIixcbiAgICBcInZ1ZS1yb3V0ZXJcIjogXCJeNC40LjBcIixcbiAgICBcInZ1ZWRyYWdnYWJsZVwiOiBcIl40LjEuMFwiXG4gIH0sXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcIkBjb21taXRsaW50L2NsaVwiOiBcIl4xOC40LjNcIixcbiAgICBcIkBjb21taXRsaW50L2NvbmZpZy1jb252ZW50aW9uYWxcIjogXCJeMTguNC4zXCIsXG4gICAgXCJAdHlwZXMvbWQ1XCI6IFwiXjIuMy41XCIsXG4gICAgXCJAdHlwZXMvbnByb2dyZXNzXCI6IFwiXjAuMi4zXCIsXG4gICAgXCJAdHlwZXMvcXNcIjogXCJeNi45LjE1XCIsXG4gICAgXCJAdHlwZXMvc29ydGFibGVqc1wiOiBcIl4xLjE1LjhcIixcbiAgICBcIkB0eXBlc2NyaXB0LWVzbGludC9lc2xpbnQtcGx1Z2luXCI6IFwiXjcuMTQuMVwiLFxuICAgIFwiQHR5cGVzY3JpcHQtZXNsaW50L3BhcnNlclwiOiBcIl43LjE0LjFcIixcbiAgICBcIkB2aXRlanMvcGx1Z2luLXZ1ZVwiOiBcIl41LjAuNFwiLFxuICAgIFwiQHZpdGVqcy9wbHVnaW4tdnVlLWpzeFwiOiBcIl4zLjEuMFwiLFxuICAgIFwiYXV0b3ByZWZpeGVyXCI6IFwiXjEwLjQuMTlcIixcbiAgICBcImNvZGUtaW5zcGVjdG9yLXBsdWdpblwiOiBcIl4wLjE2LjFcIixcbiAgICBcImN6LWdpdFwiOiBcIjEuOS4yXCIsXG4gICAgXCJjemdcIjogXCJeMS45LjJcIixcbiAgICBcImVzbGludFwiOiBcIl44LjU3LjBcIixcbiAgICBcImVzbGludC1jb25maWctcHJldHRpZXJcIjogXCJeOS4xLjBcIixcbiAgICBcImVzbGludC1wbHVnaW4tcHJldHRpZXJcIjogXCJeNS4xLjNcIixcbiAgICBcImVzbGludC1wbHVnaW4tdnVlXCI6IFwiXjkuMjYuMFwiLFxuICAgIFwiaHVza3lcIjogXCJeOS4wLjExXCIsXG4gICAgXCJsaW50LXN0YWdlZFwiOiBcIl4xNS4yLjVcIixcbiAgICBcInBvc3Rjc3NcIjogXCJeOC40LjM4XCIsXG4gICAgXCJwb3N0Y3NzLWh0bWxcIjogXCJeMS43LjBcIixcbiAgICBcInByZXR0aWVyXCI6IFwiXjMuMy4yXCIsXG4gICAgXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIjogXCJeNS4xMi4wXCIsXG4gICAgXCJzYXNzXCI6IFwiXjEuNzcuNlwiLFxuICAgIFwic3RhbmRhcmQtdmVyc2lvblwiOiBcIl45LjUuMFwiLFxuICAgIFwic3R5bGVsaW50XCI6IFwiXjE2LjYuMVwiLFxuICAgIFwic3R5bGVsaW50LWNvbmZpZy1odG1sXCI6IFwiXjEuMS4wXCIsXG4gICAgXCJzdHlsZWxpbnQtY29uZmlnLXJlY2Vzcy1vcmRlclwiOiBcIl41LjAuMVwiLFxuICAgIFwic3R5bGVsaW50LWNvbmZpZy1yZWNvbW1lbmRlZC1zY3NzXCI6IFwiXjE0LjAuMFwiLFxuICAgIFwic3R5bGVsaW50LWNvbmZpZy1yZWNvbW1lbmRlZC12dWVcIjogXCJeMS41LjBcIixcbiAgICBcInN0eWxlbGludC1jb25maWctc3RhbmRhcmRcIjogXCJeMzYuMC4wXCIsXG4gICAgXCJzdHlsZWxpbnQtY29uZmlnLXN0YW5kYXJkLXNjc3NcIjogXCJeMTMuMS4wXCIsXG4gICAgXCJ0eXBlc2NyaXB0XCI6IFwiXjUuNS4yXCIsXG4gICAgXCJ1bnBsdWdpbi12dWUtc2V0dXAtZXh0ZW5kLXBsdXNcIjogXCJeMS4wLjFcIixcbiAgICBcInZpdGVcIjogXCJeNS4zLjJcIixcbiAgICBcInZpdGUtcGx1Z2luLWNvbXByZXNzaW9uXCI6IFwiXjAuNS4xXCIsXG4gICAgXCJ2aXRlLXBsdWdpbi1lc2xpbnRcIjogXCJeMS44LjFcIixcbiAgICBcInZpdGUtcGx1Z2luLWh0bWxcIjogXCJeMy4yLjJcIixcbiAgICBcInZpdGUtcGx1Z2luLXB3YVwiOiBcIl4wLjIwLjBcIixcbiAgICBcInZpdGUtcGx1Z2luLXN2Zy1pY29uc1wiOiBcIl4yLjAuMVwiLFxuICAgIFwidml0ZS1wbHVnaW4tdnVlLWRldnRvb2xzXCI6IFwiXjcuMy41XCIsXG4gICAgXCJ2dWUtdHNjXCI6IFwiXjIuMC4yMlwiXG4gIH0sXG4gIFwiZW5naW5lc1wiOiB7XG4gICAgXCJub2RlXCI6IFwiPj0xNi4xOC4wXCJcbiAgfSxcbiAgXCJicm93c2Vyc2xpc3RcIjoge1xuICAgIFwicHJvZHVjdGlvblwiOiBbXG4gICAgICBcIj4gMSVcIixcbiAgICAgIFwibm90IGRlYWRcIixcbiAgICAgIFwibm90IG9wX21pbmkgYWxsXCJcbiAgICBdLFxuICAgIFwiZGV2ZWxvcG1lbnRcIjogW1xuICAgICAgXCJsYXN0IDEgY2hyb21lIHZlcnNpb25cIixcbiAgICAgIFwibGFzdCAxIGZpcmVmb3ggdmVyc2lvblwiLFxuICAgICAgXCJsYXN0IDEgc2FmYXJpIHZlcnNpb25cIlxuICAgIF1cbiAgfSxcbiAgXCJjb25maWdcIjoge1xuICAgIFwiY29tbWl0aXplblwiOiB7XG4gICAgICBcInBhdGhcIjogXCJub2RlX21vZHVsZXMvY3otZ2l0XCJcbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMlcsU0FBUyxjQUFjLGVBQXNDO0FBQ3hhLFNBQVMsV0FBQUEsZ0JBQWU7OztBQ3FCakIsU0FBUyxXQUFXLFNBQThCO0FBQ3ZELFFBQU0sTUFBVyxDQUFDO0FBRWxCLGFBQVcsV0FBVyxPQUFPLEtBQUssT0FBTyxHQUFHO0FBQzFDLFFBQUksV0FBVyxRQUFRLE9BQU8sRUFBRSxRQUFRLFFBQVEsSUFBSTtBQUNwRCxlQUFXLGFBQWEsU0FBUyxPQUFPLGFBQWEsVUFBVSxRQUFRO0FBQ3ZFLFFBQUksWUFBWSxZQUFhLFlBQVcsT0FBTyxRQUFRO0FBQ3ZELFFBQUksWUFBWSxjQUFjO0FBQzVCLFVBQUk7QUFDRixtQkFBVyxLQUFLLE1BQU0sUUFBUTtBQUFBLE1BQ2hDLFNBQVMsT0FBTztBQUFBLE1BQUM7QUFBQSxJQUNuQjtBQUNBLFFBQUksT0FBTyxJQUFJO0FBQUEsRUFDakI7QUFDQSxTQUFPO0FBQ1Q7OztBQ3pCTyxTQUFTLFlBQVksT0FBa0IsQ0FBQyxHQUFHO0FBQ2hELFFBQU0sTUFBdUIsQ0FBQztBQUM5QixhQUFXLENBQUMsUUFBUSxNQUFNLEtBQUssTUFBTTtBQUNuQyxVQUFNLFVBQVU7QUFDaEIsVUFBTSxVQUFVLFFBQVEsS0FBSyxNQUFNO0FBR25DLFFBQUksTUFBTSxJQUFJO0FBQUEsTUFDWjtBQUFBLE1BQ0EsY0FBYztBQUFBLE1BQ2QsSUFBSTtBQUFBLE1BQ0osU0FBUyxVQUFRLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxNQUFNLEVBQUUs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QSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBVTtBQUFBLElBQ1IsWUFBYztBQUFBLE1BQ1osTUFBUTtBQUFBLElBQ1Y7QUFBQSxFQUNGO0FBQ0Y7OztBSnZIQSxPQUFPLFdBQVc7QUFObEIsSUFBTSxtQ0FBbUM7QUFRekMsSUFBTSxFQUFFLGNBQWMsaUJBQWlCLE1BQU0sUUFBUSxJQUFJO0FBQ3pELElBQU0sZUFBZTtBQUFBLEVBQ25CLEtBQUssRUFBRSxjQUFjLGlCQUFpQixNQUFNLFFBQVE7QUFBQSxFQUNwRCxlQUFlLE1BQU0sRUFBRSxPQUFPLHFCQUFxQjtBQUNyRDtBQUdBLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUE2QjtBQUMvRCxRQUFNLE9BQU8sUUFBUSxJQUFJO0FBQ3pCLFFBQU0sTUFBTSxRQUFRLE1BQU0sSUFBSTtBQUM5QixRQUFNLFVBQVUsV0FBVyxHQUFHO0FBRTlCLFNBQU87QUFBQTtBQUFBLElBRUwsTUFBTSxRQUFRO0FBQUEsSUFDZDtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBS0MsU0FBUSxrQ0FBVyxPQUFPO0FBQUEsUUFDL0IsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixjQUFjLEtBQUssVUFBVSxZQUFZO0FBQUEsSUFDM0M7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILHFCQUFxQjtBQUFBLFFBQ25CLE1BQU07QUFBQSxVQUNKLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU0sUUFBUTtBQUFBLE1BQ2QsTUFBTSxRQUFRO0FBQUEsTUFDZCxNQUFNO0FBQUE7QUFBQSxNQUVOLE9BQU8sWUFBWSxRQUFRLFVBQVU7QUFBQSxJQUN2QztBQUFBLElBQ0EsU0FBUyxrQkFBa0IsT0FBTztBQUFBLElBQ2xDLFNBQVM7QUFBQSxNQUNQLE1BQU0sUUFBUSxvQkFBb0IsQ0FBQyxlQUFlLFVBQVUsSUFBSSxDQUFDO0FBQUEsSUFDbkU7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFTUixXQUFXO0FBQUE7QUFBQSxNQUVYLHNCQUFzQjtBQUFBO0FBQUEsTUFFdEIsdUJBQXVCO0FBQUEsTUFDdkIsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBO0FBQUEsVUFFTixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxVQUNoQixnQkFBZ0I7QUFBQSxRQUNsQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInJlc29sdmUiLCAicmVzb2x2ZSJdCn0K
