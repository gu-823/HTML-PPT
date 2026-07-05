# SlideForge · HTML 幻灯片可视化编辑器

基于 Web 的 HTML 幻灯片可视化编辑器，支持上传 HTML 幻灯片后双模式编辑（可视化 + 代码），并可导出为文件下载。

## ✨ 核心功能

- **文件上传**：拖拽 / 点击上传本地 `.html` 幻灯片，内置示例可免上传体验
- **双模式编辑**
  - 可视化编辑：类 PPT 交互，所见即所得
  - 代码编辑：Monaco 编辑器直接修改 HTML 源码（Ctrl + S 应用到画布）
- **可视化编辑能力**
  - 点击选中元素（青蓝虚线框 + 8 个缩放手柄）
  - 拖拽移动元素位置、拖动手柄调整尺寸
  - 双击文字内联编辑
  - 字号滑块、加粗 / 斜体 / 下划线、对齐、文字色 / 背景色
  - 上传本地图片插入
  - 嵌入 YouTube / Bilibili / 通用视频链接
  - 数值微调 X / Y / 宽 / 高、删除元素
- **文件管理**：覆盖保存（原文件名）或另存为新文件，Blob 一键下载
- **其他**：幻灯片缩略图导航、新增 / 复制页面、撤销 / 重做、画布缩放

## 🛠 技术栈

- React 18 + TypeScript + Vite
- TailwindCSS 3（暗色主题）
- Zustand（状态管理 + 历史栈）
- Monaco Editor（代码编辑）
- iframe `srcdoc` 沙箱渲染 + `postMessage` 双向通信
- 纯前端，无后端依赖，跨浏览器运行

## 🚀 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 类型检查
pnpm run check

# 生产构建
pnpm run build
```

## 📂 项目结构

```
src/
├── components/
│   ├── editor/        # 编辑器组件（Toolbar / Canvas / SlidePanel / PropertyPanel / CodeEditor / ExportModal）
│   └── upload/        # 上传组件
├── pages/             # 页面（Home / Editor）
├── store/             # Zustand 状态管理
├── types/             # 类型定义
├── utils/             # 工具函数（幻灯片解析 / 视频嵌入 / iframe 脚本 / 示例）
└── lib/               # 通用工具
```

## 📐 设计说明

采用深炭灰底 + 琥珀金强调的暗色编辑器风格，标题使用几何感强的 Sora 字体，正文使用 Inter Tight，代码使用 JetBrains Mono。

## 📄 文档

产品需求与技术架构文档位于 `.trae/documents/`。
