import { store } from '../../core/store.js';
import { ACCENT_COLOR, TEXT_COLOR } from '../../services/theme.js';
import { calculateTerminalMetrics } from '../../services/layout.js';
import { getPagingInfo } from './paging.js';
import { measureWrappedLines } from '../../services/text-metrics.js';

export function drawTerminal(canvas) {
  if (!store.terminal.active) return;
  const ctx = canvas.getContext('2d');
  const { height, lineHeight, maxWidth } = calculateTerminalMetrics(canvas);

  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, canvas.height - height, canvas.width, height);
  ctx.strokeStyle = ACCENT_COLOR;
  ctx.strokeRect(0, canvas.height - height, canvas.width, height);

  ctx.fillStyle = TEXT_COLOR;
  const { outputLines, inputLines, visibleOutputLines, maxStartOffset } = getPagingInfo(canvas, maxWidth);
  store.terminal.outputLineOffset = Math.min(Math.max(0, store.terminal.outputLineOffset), maxStartOffset);
  const startIndex = visibleOutputLines > 0 ? store.terminal.outputLineOffset : 0;
  const endIndex = visibleOutputLines > 0 ? Math.min(startIndex + visibleOutputLines, outputLines.length) : 0;
  const visibleLines = outputLines.slice(startIndex, endIndex);

  visibleLines.forEach((line, i) => {
    ctx.fillText(line, 10, canvas.height - height + 20 + i * lineHeight);
  });
  inputLines.forEach((line, i) => {
    ctx.fillText(line, 10, canvas.height - height + 20 + (visibleLines.length + i) * lineHeight);
  });

  if (store.terminal.caretVisible && store.terminal.active) {
    const inputPrefix = '> ' + store.terminal.input.slice(0, store.terminal.caretPosition);
    const wrapped = measureWrappedLines(ctx, inputPrefix, maxWidth);
    const caretLineIndex = wrapped.length - 1;
    const caretLineText = wrapped[caretLineIndex];
    const caretX = 10 + ctx.measureText(caretLineText).width;
    const caretY = canvas.height - height + 20 + (visibleLines.length + caretLineIndex) * lineHeight;
    ctx.beginPath();
    ctx.moveTo(caretX, caretY - 10);
    ctx.lineTo(caretX, caretY);
    ctx.strokeStyle = TEXT_COLOR;
    ctx.stroke();
  }

  if (store.terminal.selectionStart != null && store.terminal.selectionEnd != null) {
    const selStart = Math.min(store.terminal.selectionStart, store.terminal.selectionEnd);
    const selEnd = Math.max(store.terminal.selectionStart, store.terminal.selectionEnd);
    for (let i = 0; i < visibleLines.length; i++) {
      const absoluteIndex = startIndex + i;
      if (absoluteIndex >= selStart && absoluteIndex <= selEnd) {
        ctx.fillStyle = 'rgba(0,255,170,0.15)';
        ctx.fillRect(8, canvas.height - height + 8 + i * lineHeight, maxWidth + 2, lineHeight);
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(visibleLines[i], 10, canvas.height - height + 20 + i * lineHeight);
      }
    }
  }

  if (visibleOutputLines > 0 && outputLines.length > visibleOutputLines) {
    const trackX = canvas.width - 8;
    const trackY = canvas.height - height + 2;
    const trackWidth = 6;
    const trackHeight = height - 4;
    ctx.fillStyle = '#333333';
    ctx.fillRect(trackX, trackY, trackWidth, trackHeight);

    const thumbMinHeight = 10;
    const totalScrollableLines = outputLines.length;
    const thumbHeight = Math.max(
      thumbMinHeight,
      Math.floor(trackHeight * (visibleOutputLines / totalScrollableLines))
    );
    const maxThumbY = trackY + trackHeight - thumbHeight;
    const ratio = maxStartOffset === 0 ? 0 : store.terminal.outputLineOffset / maxStartOffset;
    const thumbY = Math.min(maxThumbY, trackY + Math.floor((trackHeight - thumbHeight) * ratio));
    ctx.fillStyle = ACCENT_COLOR;
    ctx.fillRect(trackX, thumbY, trackWidth, thumbHeight);

    store.terminal._scrollbar = { trackX, trackY, trackWidth, trackHeight, thumbY, thumbHeight };
  }
}

