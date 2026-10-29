# WroughtMind — experience a dream

WroughtMind 组织官网：https://wroughtmind.github.io/

旗面上的两枚项目印记打开同一个液态玻璃详情窗。魏碑展示 Webi 与小朱的真实动画及工作台；Creditia 展示仓库中的四种真实导出样张。保留原始手形标志、WeiBei Stele 字体、明暗主题与动态材质。向下滚动时，同一块旗面舒展、虚化为底层背景，承接母品牌理念。

## 修改入口

| 内容 | 文件 |
| --- | --- |
| 旗面入口、项目理念、弹窗与浏览器历史 | `src/App.jsx` |
| 母品牌理念、上下文项目入口 | `src/BrandStory.jsx` |
| 滚动展开、阅读段落显现 | `src/useFlagUnfold.js` |
| 旗面构图、玻璃材质、手机布局 | `src/styles.css` |
| Webi 动画与 Creditia 样张互动 | `src/ProjectExhibits.jsx`、`src/project-exhibits.css` |
| 织物光影与折射 | `src/DreamSurface.jsx`、`src/canvas-surface.js`、`src/surface-motion.js` |
| 主分支统计快照 | `src/project-stats.json` |
| 统计更新 | `scripts/update-project-stats.mjs` |
| 新素材来源 | `public/assets/projects/SOURCES.md` |

## 预览与验证

使用 Node.js 22.12+：

```sh
npm ci
npm run dev
npm run build
npm run preview
```

`#weibei`、`#creditia` 可以直接分享。点击项目时保留浏览历史，弹窗内切换项目不会新增层级；关闭、Esc 或后退返回原来的阅读位置，前进恢复详情。历史记录保留触发入口与滚动位置，刷新详情后关闭也能回到对应入口。弹窗正文独立滚动，关闭和官网入口始终可见。

设备启用“减少动态效果”时，织物停止持续绘制、Webi 改用静态图，详情和作品切换不播放过渡。页面不可见时停止背景绘制。减少动态效果时关闭旗面缩放和阅读段落的位移，保留随滚动变化的静态模糊与文字层次。

## 数据口径

```sh
npm run stats
```

脚本从 GitHub 默认分支读取不可变提交 revision，在同一 revision 下统计可达提交数，并取历史末页的首个提交。页面展示 **First commit**，不把建仓日期或提交日期冒充未经证实的立项时间。日期按 Asia/Shanghai 显示，快照时间在数据下方标注；GitHub 请求失败会终止更新，不写入假数。

GitHub Pages 工作流在每次发布构建前刷新快照。生产文件只包含公开统计，不包含令牌或客户端 GitHub 请求。Creditia 样张中的数字属于原始样张，不代表当前主分支统计。

## 发布

`.github/workflows/pages.yml` 在 `main` 更新时构建并发布 GitHub Pages。功能分支本身不会发布。生产构建生成 `dist/`，不提交构建文件。构建通过、自动发布成功、浏览器实测是不同的验证结果。

品牌素材保留在 `public/brand/`，官网不提供素材下载入口。完整品牌约束见 `BRAND.md`。
