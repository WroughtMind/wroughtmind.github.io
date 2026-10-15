# WroughtMind — experience a dream

WroughtMind 组织官网：https://wroughtmind.github.io/

保留原站点的明暗主题、动态材质、Weibei / Creditia 作品展示。字体、图片与品牌素材都在仓库内，无需外部图片或字体服务。

## 日常修改

| 想改什么 | 文件 |
| --- | --- |
| 标语、导航、作品简介与链接 | `src/App.jsx` |
| 字体、颜色、间距与手机布局 | `src/styles.css` |
| 首页动态材质 | `src/DreamSurface.jsx`、`src/canvas-surface.js` |
| Logo、字体、背景和作品截图 | `public/assets/` |
| 可下载的横幅和海报 | `public/brand/` |
| 网页标题、搜索摘要和分享信息 | `index.html` |

小改动可以直接在 GitHub 打开对应文件，点击编辑按钮修改并提交到 `main`。每次提交都会自动构建并发布，进度见仓库 **Actions → Publish website**。发布成功后刷新官网即可看到更新。无需手工上传构建文件。

## 本地预览

使用 Node.js 22.12+：

```sh
npm ci
npm run dev
```

发布前可检查生产版本：

```sh
npm run build
npm run preview
```

生产文件生成到 `dist/`，不会提交到仓库。Pages 的发布源为 GitHub Actions，配置位于 `.github/workflows/pages.yml`。

## 设计与来源

保持手形 Logo、WeiBei Stele 字体及原标语 `experience a dream`。明色使用暖象牙白织物材质，暗色使用蓝黑石质与水面折射；整页保持相同视觉语言。品牌规范见 `BRAND.md`。

源码迁移自原 WroughtMind Sites 站点。本仓库独立使用 GitHub Pages，无需 Sites 服务或服务器。WeiBeiStele.ttf 与产品截图来自对应 WroughtMind 项目；背景、横幅与海报基于原选定视觉方向生成。迁移时未改变页面布局与交互。
