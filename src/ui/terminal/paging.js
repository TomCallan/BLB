import { store } from '../../core/store.js';
import { calculateTerminalMetrics } from '../../services/layout.js';
import { measureWrappedLines } from '../../services/text-metrics.js';

export function getWrappedOutputLines(canvas, maxWidth) {
  const wrapped = [];
  const ctx = canvas.getContext('2d');
  store.terminal.output.forEach((line) => {
    const parts = String(line).split('\n');
    parts.forEach((part) => {
      wrapped.push(...measureWrappedLines(ctx, part, maxWidth));
    });
  });
  return wrapped;
}

export function measureInputLines(canvas, maxWidth) {
  const ctx = canvas.getContext('2d');
  return measureWrappedLines(ctx, '> ' + store.terminal.input, maxWidth);
}

export function getPagingInfo(canvas, maxWidth) {
  const outputLines = getWrappedOutputLines(canvas, maxWidth);
  const inputLines = measureInputLines(canvas, maxWidth);
  const reservedInputLines = Math.max(1, inputLines.length);
  const visibleOutputLines = Math.max(0, store.terminal.linesPerPage - reservedInputLines);
  const maxStartOffset = Math.max(0, outputLines.length - visibleOutputLines);
  return { outputLines, inputLines, reservedInputLines, visibleOutputLines, maxStartOffset };
}

