'use client';

import { toPng } from 'html-to-image';

async function waitForImages(node: HTMLElement) {
  const imgs = Array.from(node.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(imgs.map((img) => img.decode().catch(() => null)));
}

function raf() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

export async function exportNodeToPng(node: HTMLElement, filename: string): Promise<void> {
  await document.fonts.ready;
  await raf();
  await raf();
  await waitForImages(node);

  // Note: no `fetchRequestInit: { cache: 'no-cache' }` — browser cache is fine here
  // and forcing no-cache makes the first export slow (re-fetches all inlined stylesheets).
  const dataUrl = await toPng(node, { pixelRatio: 2 });

  const a = document.createElement('a');
  a.download = filename;
  a.href = dataUrl;
  // Must be in the DOM for Firefox compatibility and for Playwright to detect it
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
