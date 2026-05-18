export type BlockType = 'heading' | 'text' | 'image' | 'video';

export interface Block {
  id: string;
  type: BlockType;
  text: string;
  url: string;
  caption: string;
}

export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: 'Título',
  text: 'Texto',
  image: 'Imagen',
  video: 'Video',
};

export const newId = () => Math.random().toString(36).slice(2, 10);

export const makeBlock = (type: BlockType): Block => ({
  id: newId(),
  type,
  text: '',
  url: '',
  caption: '',
});

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const renderBlockHtml = (b: Block): string => {
  switch (b.type) {
    case 'heading':
      return `<h2 class="b-heading">${escapeHtml(b.text)}</h2>`;
    case 'text':
      return `<p class="b-text">${escapeHtml(b.text)}</p>`;
    case 'image':
      return b.url
        ? `<figure class="b-image"><img src="${escapeHtml(b.url)}" alt="${escapeHtml(
            b.caption
          )}"/>${b.caption ? `<figcaption>${escapeHtml(b.caption)}</figcaption>` : ''}</figure>`
        : '';
    case 'video':
      return b.url
        ? `<video class="b-video" src="${escapeHtml(b.url)}" controls playsinline></video>`
        : '';
  }
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
  .b-heading { font-size: 2em; margin: 28px 0 12px; line-height: 1.2; }
  .b-heading:first-child { margin-top: 0; }
  .b-text { font-size: 1.05em; line-height: 1.7; margin: 14px 0; white-space: pre-wrap; }
  .b-image { margin: 22px 0; }
  .b-image img { width: 100%; display: block; }
  .b-image figcaption { text-align: center; color: #6b7280; font-size: 0.9em; margin-top: 8px; }
  .b-video { width: 100%; margin: 22px 0; display: block; }
</style>
</head>
<body>
  <div class="page">
    ${blocks.map(renderBlockHtml).join('\n    ')}
  </div>
</body>
</html>`;
