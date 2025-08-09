import { store } from './store.js';
import { calculateTerminalMetrics, layoutState, getGridSize } from '../services/layout.js';
import { execute, autocomplete } from './commands.js';

export function attachInputHandlers(canvas) {
  window.addEventListener('resize', () => resizeCanvas(canvas));
  resizeCanvas(canvas);

  canvas.addEventListener('mousedown', (e) => onMouseDown(canvas, e));
  canvas.addEventListener('mousemove', (e) => onMouseMove(canvas, e));
  canvas.addEventListener('mouseup', () => onMouseUp());
  canvas.addEventListener('wheel', (e) => onWheel(canvas, e), { passive: false });
  document.addEventListener('keydown', (e) => onKeyDown(canvas, e));
  canvas.addEventListener('contextmenu', (e) => onContextMenu(canvas, e));
  document.addEventListener('paste', (e) => onPaste(canvas, e));
  document.addEventListener('copy', (e) => onCopy(e));
}

function resizeCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const { height, lineHeight } = calculateTerminalMetrics(canvas);
  store.terminal.linesPerPage = Math.max(1, Math.floor((height - 20) / lineHeight));
}

function onMouseDown(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const { height } = calculateTerminalMetrics(canvas);
  const termTop = canvas.height - height;
  store.selectedPlugin = null;
  store.draggingPlugin = null;
  store.resizingPlugin = null;
  store.focusedPlugin = null;
  if (y < termTop) store.terminal.active = false;

  // plugins from top-most
  for (let i = store.plugins.length - 1; i >= 0; i--) {
    const plugin = store.plugins[i];
    if (plugin.isPointInResizeHandle && plugin.isPointInResizeHandle(x, y)) {
      store.resizingPlugin = plugin;
      store.selectedPlugin = plugin;
      store.focusedPlugin = plugin;
      store.offsetX = x - (plugin.x + plugin.width);
      store.offsetY = y - (plugin.y + plugin.height);
      break;
    } else if (typeof plugin.onMouseDown === 'function') {
      const handled = plugin.onMouseDown(x, y);
      if (handled) {
        store.focusedPlugin = plugin;
        store.selectedPlugin = plugin;
        // bring to front
        store.plugins.splice(i, 1);
        store.plugins.push(plugin);
        break;
      }
    }
    if (plugin.isPointInside(x, y)) {
      store.selectedPlugin = plugin;
      store.draggingPlugin = plugin;
      store.focusedPlugin = plugin;
      store.offsetX = x - plugin.x;
      store.offsetY = y - plugin.y;
      // bring to front
      store.plugins.splice(i, 1);
      store.plugins.push(plugin);
      break;
    }
  }

  // scrollbar activation & terminal focus
  const sb = store.terminal._scrollbar;
  if (y >= termTop) {
    store.terminal.active = true;
    store.focusedPlugin = null;
    // Begin selection if clicked in output area (not scrollbar)
    const { lineHeight, maxWidth } = calculateTerminalMetrics(canvas);
    const contentTop = termTop + 20; // matches drawTerminal baseline
    const { outputLines, visibleOutputLines } = getPagingInfo(canvas, maxWidth);
    const withinScrollbar = sb && x >= sb.trackX && x <= sb.trackX + sb.trackWidth;
    if (!withinScrollbar && y >= contentTop && visibleOutputLines > 0) {
      const relY = y - contentTop;
      const lineIdx = Math.floor(relY / lineHeight);
      const clamped = Math.max(0, Math.min(visibleOutputLines - 1, lineIdx));
      const absoluteIndex = Math.min(
        outputLines.length - 1,
        store.terminal.outputLineOffset + clamped
      );
      store.terminal.isSelecting = true;
      store.terminal.selectionStart = absoluteIndex;
      store.terminal.selectionEnd = absoluteIndex;
    } else {
      store.terminal.isSelecting = false;
      store.terminal.selectionStart = null;
      store.terminal.selectionEnd = null;
    }
  }
  if (
    sb &&
    x >= sb.trackX &&
    x <= sb.trackX + sb.trackWidth &&
    y >= sb.trackY &&
    y <= sb.trackY + sb.trackHeight
  ) {
    if (y >= sb.thumbY && y <= sb.thumbY + sb.thumbHeight) {
      isDraggingScrollbar = true;
      scrollbarDragOffsetY = y - sb.thumbY;
    } else {
      const ratio = (y - sb.trackY) / Math.max(1, sb.trackHeight - sb.thumbHeight);
      const { maxWidth } = calculateTerminalMetrics(canvas);
      const { maxStartOffset } = getPagingInfo(canvas, maxWidth);
      store.terminal.outputLineOffset = Math.round(ratio * maxStartOffset);
    }
  }
}

let isDraggingScrollbar = false;
let scrollbarDragOffsetY = 0;

function onMouseMove(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (store.draggingPlugin) {
    const gs = getGridSize();
    store.draggingPlugin.x = Math.round((x - store.offsetX) / gs) * gs;
    store.draggingPlugin.y = Math.round((y - store.offsetY) / gs) * gs;
  } else if (store.resizingPlugin) {
    const gs = getGridSize();
    store.resizingPlugin.width = Math.max(150, Math.round((x - store.resizingPlugin.x - store.offsetX) / gs) * gs);
    store.resizingPlugin.height = Math.max(100, Math.round((y - store.resizingPlugin.y - store.offsetY) / gs) * gs);
  }
  // Update selection while dragging in terminal
  if (store.terminal.isSelecting) {
    const { height, lineHeight, maxWidth } = calculateTerminalMetrics(canvas);
    const termTop = canvas.height - height;
    const contentTop = termTop + 20;
    const { outputLines, visibleOutputLines } = getPagingInfo(canvas, maxWidth);
    const relY = y - contentTop;
    const lineIdx = Math.floor(relY / lineHeight);
    const clamped = Math.max(0, Math.min(visibleOutputLines - 1, lineIdx));
    const absoluteIndex = Math.min(
      outputLines.length - 1,
      Math.max(0, store.terminal.outputLineOffset + clamped)
    );
    store.terminal.selectionEnd = absoluteIndex;
  }
  if (!isDraggingScrollbar || !store.terminal._scrollbar) return;
  const sb = store.terminal._scrollbar;
  const newThumbTop = Math.min(
    Math.max(sb.trackY, y - scrollbarDragOffsetY),
    sb.trackY + sb.trackHeight - sb.thumbHeight
  );
  const ratio = (newThumbTop - sb.trackY) / Math.max(1, sb.trackHeight - sb.thumbHeight);
  const { maxWidth } = calculateTerminalMetrics(canvas);
  const { maxStartOffset } = getPagingInfo(canvas, maxWidth);
  store.terminal.outputLineOffset = Math.round(ratio * maxStartOffset);
}

function onMouseUp() {
  store.draggingPlugin = null;
  store.resizingPlugin = null;
  isDraggingScrollbar = false;
}

import { getPagingInfo } from '../ui/terminal/paging.js';

function onWheel(canvas, e) {
  if (!store.terminal.active) return;
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const { height, lineHeight } = calculateTerminalMetrics(canvas);
  if (y >= canvas.height - height) {
    const deltaLines = e.deltaY / lineHeight;
    store.terminal.scrollAccumulatorLines += deltaLines;
    let steps = 0;
    if (Math.abs(store.terminal.scrollAccumulatorLines) >= 1) {
      steps =
        store.terminal.scrollAccumulatorLines > 0
          ? Math.floor(store.terminal.scrollAccumulatorLines)
          : Math.ceil(store.terminal.scrollAccumulatorLines);
      store.terminal.scrollAccumulatorLines -= steps;
    }
    if (steps !== 0) {
      const { maxWidth } = calculateTerminalMetrics(canvas);
      const { maxStartOffset } = getPagingInfo(canvas, maxWidth);
      store.terminal.outputLineOffset = Math.min(
        Math.max(0, store.terminal.outputLineOffset + steps),
        maxStartOffset
      );
    }
    e.preventDefault();
  }
}

function onKeyDown(canvas, e) {
  if (e.key === '/') {
    store.terminal.active = !store.terminal.active;
    store.focusedPlugin = null;
    e.preventDefault();
    return;
  }
  if (store.terminal.active) {
    if (e.key === 'PageDown') {
      pageScroll(canvas, 1);
      e.preventDefault();
      return;
    }
    // Copy
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
      const selection = getSelectedTerminalText(canvas);
      if (selection) {
        navigator.clipboard && navigator.clipboard.writeText(selection).catch(() => {});
      }
      e.preventDefault();
      return;
    }
    // Paste
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then((text) => insertAtCaret(text));
      }
      e.preventDefault();
      return;
    }
    if (e.key === 'PageUp') {
      pageScroll(canvas, -1);
      e.preventDefault();
      return;
    }
    if (e.key === 'End') {
      const { maxWidth } = calculateTerminalMetrics(canvas);
      const { maxStartOffset } = getPagingInfo(canvas, maxWidth);
      store.terminal.outputLineOffset = maxStartOffset;
      e.preventDefault();
      return;
    }
    if (e.key === 'Home') {
      store.terminal.outputLineOffset = 0;
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      execute(store.terminal.input, canvas);
    } else if (e.key === 'Backspace') {
      if (store.terminal.caretPosition > 0) {
        store.terminal.input =
          store.terminal.input.slice(0, store.terminal.caretPosition - 1) +
          store.terminal.input.slice(store.terminal.caretPosition);
        store.terminal.caretPosition--;
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const comps = autocomplete(store.terminal.input, store.terminal.caretPosition);
      if (comps.length > 0) {
        const [cmdPart, ...args] = store.terminal.input
          .slice(0, store.terminal.caretPosition)
          .split(' ');
        if (args.length === 0) {
          store.terminal.input = comps[0] + ' ' + store.terminal.input.slice(store.terminal.caretPosition);
          store.terminal.caretPosition = comps[0].length + 1;
        } else {
          const newArg = comps[0];
          store.terminal.input = cmdPart + ' ' + newArg + ' ' + store.terminal.input.slice(store.terminal.caretPosition);
          store.terminal.caretPosition = cmdPart.length + 1 + newArg.length + 1;
        }
      }
    } else if (e.key === 'ArrowLeft' && store.terminal.caretPosition > 0) {
      store.terminal.caretPosition--;
    } else if (e.key === 'ArrowRight' && store.terminal.caretPosition < store.terminal.input.length) {
      store.terminal.caretPosition++;
    } else if (e.key === 'ArrowUp' && store.terminal.historyIndex > 0) {
      store.terminal.historyIndex--;
      store.terminal.input = store.terminal.history[store.terminal.historyIndex];
      store.terminal.caretPosition = store.terminal.input.length;
    } else if (e.key === 'ArrowDown' && store.terminal.historyIndex < store.terminal.history.length - 1) {
      store.terminal.historyIndex++;
      store.terminal.input = store.terminal.history[store.terminal.historyIndex] || '';
      store.terminal.caretPosition = store.terminal.input.length;
    } else if (e.key.length === 1) {
      store.terminal.input =
        store.terminal.input.slice(0, store.terminal.caretPosition) +
        e.key +
        store.terminal.input.slice(store.terminal.caretPosition);
      store.terminal.caretPosition++;
    }
  } else if (store.focusedPlugin && typeof store.focusedPlugin.onKeyDown === 'function') {
    const handled = store.focusedPlugin.onKeyDown(e);
    if (handled) return;
  }
}

function pageScroll(canvas, deltaPages) {
  const { maxWidth } = calculateTerminalMetrics(canvas);
  const { visibleOutputLines, maxStartOffset } = getPagingInfo(canvas, maxWidth);
  const linesDelta = (visibleOutputLines || 1) * deltaPages;
  store.terminal.outputLineOffset = Math.min(
    Math.max(0, store.terminal.outputLineOffset + linesDelta),
    maxStartOffset
  );
}

function onContextMenu(canvas, e) {
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const { height } = calculateTerminalMetrics(canvas);
  const termTop = canvas.height - height;
  if (y >= termTop) {
    // Right-click in terminal area -> paste
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then((text) => insertAtCaret(text));
      e.preventDefault();
    }
  }
}

function onPaste(canvas, e) {
  if (!store.terminal.active) return;
  const text = (e.clipboardData && e.clipboardData.getData('text')) || '';
  if (text) {
    insertAtCaret(text);
    e.preventDefault();
  }
}

function onCopy(e) {
  const selection = getSelectedTerminalText();
  if (selection && e.clipboardData) {
    e.clipboardData.setData('text/plain', selection);
    e.preventDefault();
  }
}

function insertAtCaret(text) {
  const t = store.terminal;
  const insert = String(text).replace(/\r\n|\r/g, '\n');
  t.input = t.input.slice(0, t.caretPosition) + insert + t.input.slice(t.caretPosition);
  t.caretPosition += insert.length;
}

function getSelectedTerminalText(canvas) {
  const t = store.terminal;
  if (t.selectionStart == null || t.selectionEnd == null) return '';
  const start = Math.min(t.selectionStart, t.selectionEnd);
  const end = Math.max(t.selectionStart, t.selectionEnd);
  // Recreate visible terminal lines to slice selection
  const { maxWidth } = calculateTerminalMetrics(canvas || document.getElementById('dashboard'));
  const ctx = (canvas || document.getElementById('dashboard')).getContext('2d');
  const { outputLines } = getPagingInfo(canvas || document.getElementById('dashboard'), maxWidth);
  const selected = outputLines.slice(start, end + 1).join('\n');
  return selected;
}

