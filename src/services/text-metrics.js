import { layoutState } from './layout.js';
import { FONT_FAMILY } from './theme.js';

export function measureWrappedLines(ctx, text, maxWidth) {
  ctx.font = (layoutState.isCompact ? '10px ' : '14px ') + FONT_FAMILY;
  const words = String(text).split(' ');
  const lines = [];
  let currentLine = words[0] || '';
  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const width = ctx.measureText(testLine).width;
    if (width < maxWidth) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines;
}

