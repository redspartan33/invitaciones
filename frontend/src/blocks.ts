import type { CSSProperties } from 'react';

export type BlockType = 'heading' | 'text' | 'image' | 'video';
export type AnimationType = 'none' | 'fade' | 'slide-up' | 'zoom';

export interface Block {
  id: string;
  type: BlockType;
  text: string;
  url: string;
  caption: string;
  bgColor: string;
  textColor: string;
  padding: number;
  margin: number;
  animation: AnimationType;
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Título',
  text: 'Texto',
  image: 'Imagen',
  video: 'Video',
};

export const ANIMATION_LABELS: Record<AnimationType, string> = {
  none: 'Ninguna',
  fade: 'Aparecer',
  'slide-up': 'Deslizar arriba',
  zoom: 'Zoom',
};

export const newId = () => Math.random().toString(36).slice(2, 10);

export const makeBlock = (type: BlockType): Block => ({
  id: newId(),
  type,
  text: '',
  url: '',
  caption: '',
  bgColor: '',
  textColor: '',
  padding: 0,
  margin: 16,
  animation: 'none',
});

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Inline style shared by canvas (React) and exported HTML so the editor is WYSIWYG.
export const blockWrapStyle = (b: Block): CSSProperties => ({
  backgroundColor: b.bgColor || undefined,
  color: b.textColor || undefined,
  padding: b.padding ? `${b.padding}px` : undefined,
  margin: `${b.margin}px 0`,
});

const styleAttr = (b: Block): string => {
  const parts: string[] = [];
  if (b.bgColor) parts.push(`background-color:${b.bgColor}`);
  if (b.textColor) parts.push(`color:${b.textColor}`);
  if (b.padding) parts.push(`padding:${b.padding}px`);
  parts.push(`margin:${b.margin}px 0`);
  return parts.join(';');
};

const innerHtml = (b: Block): string => {
  switch (b.type) {
    case 'heading':
      return `<h2 class="b-heading">${escapeHtml(b.text)}</h2>`;
    case 'text':
      return `<p class="b-text">${escapeHtml(b.text)}</p>`;
    case 'image':
      return b.url
        ? `<img src="${escapeHtml(b.url)}" alt="${escapeHtml(b.caption)}"/>${
            b.caption ? `<div class="b-cap">${escapeHtml(b.caption)}</div>` : ''
          }`
        : '';
    case 'video':
      return b.url ? `<video src="${escapeHtml(b.url)}" controls playsinline></video>` : '';
  }
};

const renderBlockHtml = (b: Block): string => {
  const animClass = b.animation !== 'none' ? ` anim-${b.animation}` : '';
  return `<section class="b-wrap${animClass}" style="${styleAttr(b)}">${innerHtml(b)}</section>`;
};

export const generateHtmlContent = (title: string, blocks: Block[]): string => `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #ffffff; padding: 32px 20px; color: #1f2330; }
  .page { max-width: 640px; margin: 0 auto; }
  .b-wrap { }
  .b-heading { font-size: 2em; line-height: 1.2; }
  .b-text { font-size: 1.05em; line-height: 1.7; white-space: pre-wrap; }
  .b-wrap img { width: 100%; display: block; }
  .b-cap { text-align: center; color: #6b7280; font-size: 0.9em; margin-top: 8px; }
  .b-wrap video { width: 100%; display: block; }
  @keyframes b-fade { from { opacity: 0 } to { opacity: 1 } }
  @keyframes b-slide-up { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: none } }
  @keyframes b-zoom { from { opacity: 0; transform: scale(0.92) } to { opacity: 1; transform: none } }
  .anim-fade { animation: b-fade 0.8s ease both }
  .anim-slide-up { animation: b-slide-up 0.7s ease both }
  .anim-zoom { animation: b-zoom 0.6s ease both }
</style>
</head>
<body>
  <div class="page">
    ${blocks.map(renderBlockHtml).join('\n    ')}
  </div>
</body>
</html>`;
