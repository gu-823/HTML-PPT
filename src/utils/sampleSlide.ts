// 内置示例幻灯片
export const SAMPLE_SLIDE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>示例演示文稿</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Sora", system-ui, sans-serif; }
  .slide {
    width: 100vw;
    height: 100vh;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding: 8vh 10vw;
    position: relative;
    overflow: hidden;
  }
  .slide-1 {
    background: radial-gradient(circle at 20% 30%, #1b1b23, #0e0e12);
    color: #f5f5fa;
  }
  .slide-2 {
    background: linear-gradient(135deg, #15151b 0%, #1b1b23 100%);
    color: #e6e6ec;
  }
  .slide-3 {
    background: radial-gradient(circle at 80% 70%, #2a1f12, #0e0e12);
    color: #f5f5fa;
  }
  h1 { font-size: 64px; font-weight: 700; letter-spacing: -1px; line-height: 1.1; }
  h2 { font-size: 42px; font-weight: 600; color: #f5b642; margin-bottom: 24px; }
  h3 { font-size: 28px; font-weight: 600; color: #3dd6c8; }
  p { font-size: 22px; line-height: 1.6; color: #c2c2cd; max-width: 60%; }
  .accent { color: #f5b642; }
  .tag { font-size: 16px; letter-spacing: 3px; text-transform: uppercase; color: #3dd6c8; margin-bottom: 24px; }
  .bullets { list-style: none; display: flex; flex-direction: column; gap: 18px; margin-top: 20px; }
  .bullets li { font-size: 22px; color: #e6e6ec; display: flex; align-items: center; gap: 14px; }
  .bullets li::before { content: "◆"; color: #f5b642; font-size: 14px; }
  .deco { position: absolute; right: 8vw; top: 8vh; width: 280px; height: 280px; border-radius: 50%;
    background: conic-gradient(from 0deg, #f5b642, #3dd6c8, #f5b642); filter: blur(2px); opacity: 0.8; }
  .footer { position: absolute; bottom: 5vh; left: 10vw; font-size: 14px; color: #6e6e7e; letter-spacing: 1px; }
</style>
</head>
<body>
<section class="slide slide-1">
  <div class="tag">Slide Deck Editor</div>
  <h1>用 HTML 构建<br><span class="accent">可编辑的</span>演示文稿</h1>
  <p>上传你的 HTML 幻灯片，在可视化模式下拖拽元素、调整样式，或直接编辑源码。</p>
  <div class="deco"></div>
  <div class="footer">示例幻灯片 · 第 1 页</div>
</section>
<section class="slide slide-2">
  <h2>核心功能</h2>
  <ul class="bullets">
    <li>拖拽移动文本、图片与视频元素</li>
    <li>可视化调整字号、颜色与对齐方式</li>
    <li>插入本地图片与外部视频链接</li>
    <li>代码模式直接编辑 HTML 源码</li>
  </ul>
  <div class="footer">示例幻灯片 · 第 2 页</div>
</section>
<section class="slide slide-3">
  <h3>开始你的创作</h3>
  <h2 style="margin-top:16px;">覆盖保存 或 另存为新文件</h2>
  <p>编辑完成后一键导出更新后的 HTML 文件，在浏览器中即可播放。</p>
  <div class="footer">示例幻灯片 · 第 3 页</div>
</section>
</body>
</html>`;
