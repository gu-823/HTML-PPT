// 视频链接解析与嵌入：支持 YouTube / Bilibili / 通用

export interface VideoEmbed {
  html: string;
  provider: string;
}

export function parseVideoUrl(url: string): VideoEmbed | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  // YouTube: youtu.be/ID, youtube.com/watch?v=ID, /embed/ID
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      provider: "YouTube",
      html: `<iframe data-eid="" src="https://www.youtube.com/embed/${id}" width="560" height="315" frameborder="0" allow="accelerated-auto; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position:absolute;left:60px;top:200px;width:560px;height:315px;border:0;"></iframe>`,
    };
  }

  // Bilibili: b23.tv, bilibili.com/video/BVxxxx
  const biliMatch = trimmed.match(/bilibili\.com\/video\/(BV[\w]+)|b23\.tv\/([\w]+)/i);
  if (biliMatch) {
    const bvid = biliMatch[1] || biliMatch[2];
    return {
      provider: "Bilibili",
      html: `<iframe data-eid="" src="//player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&autoplay=0" width="560" height="315" frameborder="0" allowfullscreen scrolling="no" style="position:absolute;left:60px;top:200px;width:560px;height:315px;border:0;"></iframe>`,
    };
  }

  // 通用 iframe：若看起来是可嵌入 URL
  if (/^https?:\/\/.+/i.test(trimmed)) {
    return {
      provider: "Web",
      html: `<iframe data-eid="" src="${trimmed}" width="560" height="315" frameborder="0" allowfullscreen style="position:absolute;left:60px;top:200px;width:560px;height:315px;border:0;"></iframe>`,
    };
  }

  return null;
}
