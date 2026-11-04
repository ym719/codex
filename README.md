# Art Archive

一个安静、私密的个人艺术作品管理网站。米白色背景、衬线标题与留白式画廊，支持电脑和手机。无需账号、数据库服务器或付费服务。

## 已实现功能

- 作品画廊：网格和列表视图，绘画、摄影、速写分类。
- 上传图片：点击选择或拖放，每次添加一件作品，支持 JPG / PNG / WebP / AVIF，单张最高 20 MB。
- 作品信息：名称、创作日期、类别、媒介、创作笔记；可查看、编辑、替换图片和删除。
- 筛选与搜索：按类别筛选，搜索名称、媒介和笔记；按创作日期或添加时间排序。
- 创作档案：按年份、月份展示作品，自动统计总数及各类别数量。
- 本地保存：图片以 Blob、资料以结构化对象写入 IndexedDB，刷新页面后保留。多标签页通过 BroadcastChannel 同步列表。
- 完整备份：导出包含图片的 JSON 文件；验证备份内容、图片后，在一个事务中恢复。恢复前需确认替换当前收藏。
- 友好交互：图片预览、删除确认、空状态、保存错误提示、键盘焦点约束、Esc 关闭弹窗、减少动画偏好支持。
- 初次使用展示六张原创 SVG 示例图，可一次清空。摄影分类中的图片为构图示意。上传或编辑过的作品不会被“清空示例”删除。

## 第一次使用

1. 点击右上角 **添加作品**。
2. 选一张图片，填写名称、日期、类别等信息，然后点击 **收藏作品**。
3. 点击任意作品进入详情，可编辑或删除。
4. 点击顶部 **创作档案** 查看时间线。
5. 点击 **关于** 或页脚 **作品仅保存在此浏览器**，导出或恢复备份。

**请定期备份。** 数据只属于当前浏览器、当前网站地址（协议、域名、端口共同决定）。清理网站数据、浏览器回收存储、使用隐私窗口、更换浏览器、设备或网站地址，都可能导致原有收藏无法访问。发布网站不会把任何人的本地作品上传到互联网，访客各自管理自己的收藏；它不是一个共享作品发布平台。

上传图片会转换成 WebP，最长边限制为 2400 px，保留原始比例；透明度会保留，图片元数据不会保存。需要原始分辨率文件时，请另外保管原图。导出的备份包含处理后的图片。单次导入备份上限 200 MB。

## 在自己的电脑上预览

安装 **Node.js 22 或更高版本**（推荐 22 LTS），下载仓库 ZIP 并解压，或者克隆仓库。打开终端，进入项目文件夹：

```bash
npm ci
npm run dev
```

在**运行命令的这台电脑**上，用浏览器打开终端显示的本地地址（默认端口 5173）。按 `Ctrl+C` 停止。

同一 Wi-Fi 下可用电脑的局域网 IP 和该端口在手机上访问，前提是防火墙允许。手机上的收藏与电脑上的收藏独立，需要通过备份转移。

预览生产版本：

```bash
npm run build
npm run preview
```

不能直接双击 `dist/index.html` 运行：模块脚本、资源加载与 IndexedDB 需要通过 HTTP/HTTPS 网站访问。

### 云环境预览

当前开发会话没有可分享的网页预览入口。云环境中的 `localhost` 指向云机器，并不是你的电脑，因此不能把它当作可点击的网站分享给你。开发时已通过云机器内的 Chromium 完成桌面和手机尺寸的真实浏览器验证。你可以在自己的电脑上按上述命令预览，或按以下方法部署后访问公网地址。

## 免费部署到 GitHub Pages

项目已经带有手动发布工作流 `.github/workflows/deploy.yml`，没有自动发布网站。

1. 将代码提交推送或合并到 GitHub 仓库的 `main` 分支。
2. 打开仓库 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 打开 **Actions → Deploy Art Archive to GitHub Pages → Run workflow**，选择 `main` 并运行。
4. 等待工作流完成，使用该工作流或 Pages 设置页面显示的实际网址。对于未设置自定义域名的公开仓库 `ym719/codex`，通常为 `https://ym719.github.io/codex/`，需发布成功后才可访问。

对于个人免费账户，GitHub Pages 通常要求仓库公开。`vite.config.ts` 使用相对资源路径，支持 GitHub Pages 的仓库子路径，也能部署在根路径。

### 另一种无需命令行的上线方式

如果已经拿到构建后的 `dist` 文件夹，可将整个文件夹上传到提供静态托管的平台（例如 Netlify 的手动部署页面）；不要只上传其中的 `index.html`。也可以在 Vercel 或 Netlify 中导入 GitHub 仓库，选择 **Vite**，构建命令填 `npm run build`，输出目录填 `dist`，不需要配置环境变量。使用平台提供的免费静态托管额度即可。

更换域名后，请先在旧地址导出备份，再到新地址恢复。

## 开发与验证

技术：React 19、TypeScript、Vite 6、原生 CSS、原生 IndexedDB、Lucide 图标。图片、图标及样式随站点一起部署，不依赖远程字体或图片 CDN。

```bash
npm ci
npm test                 # Vitest：筛选/排序、日期、备份校验、IndexedDB 事务
npm run build            # TypeScript 检查 + 生产构建
npx playwright install chromium
npm run test:e2e         # 构建并启动生产预览，桌面 + 手机视口浏览器测试
npm run format:check
```

Linux 缺少浏览器系统依赖时可以运行 `npx playwright install --with-deps chromium`。当前云环境已有 Chromium，可使用：

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
```

端到端测试每次使用隔离的浏览器上下文，覆盖真实图片上传和解码、刷新持久化、元数据编辑、删除取消/确认、示例清空、备份下载/恢复、损坏文件拒绝、筛选排序、时间线、键盘弹窗和无横向溢出的手机布局。手机测试为 Chromium 的手机尺寸与触摸模拟，不代表真实 iOS Safari 设备验证。截图保存在被 Git 忽略的 `test-results/` 中。

`.github/workflows/ci.yml` 在提交或拉取请求中运行格式检查、单元测试、构建及浏览器测试。

## 文件结构

```text
src/
  App.tsx                页面、作品列表、时间线和操作流程
  styles.css             响应式布局与动画
  types.ts               作品数据结构
  components/            图片、原生对话框、上传编辑表单
  lib/
    db.ts                IndexedDB 初始化及事务读写
    images.ts            图片校验和压缩
    artworks.ts          搜索、筛选、排序、统计与日期
    backup.ts            备份导出、校验、恢复图片解析
    demo.ts              首次打开的示例作品
public/artworks/         六张原创示例图，无外部素材授权依赖
tests/                  Playwright 用户操作测试
.github/workflows/      自动检查与手动发布
```
