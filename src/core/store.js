// Simple in-memory store for app state

export const store = {
  terminal: {
    active: false,
    input: '',
    caretPosition: 0,
    history: [],
    historyIndex: -1,
    output: [],
    caretVisible: true,
    outputLineOffset: 0,
    scrollAccumulatorLines: 0,
    isSelecting: false,
    selectionStart: null,
    selectionEnd: null,
    linesPerPage: 0,
    _scrollbar: null,
  },
  plugins: [],
  focusedPlugin: null,
  selectedPlugin: null,
  draggingPlugin: null,
  resizingPlugin: null,
  offsetX: 0,
  offsetY: 0,
};

export function resetSelection() {
  store.terminal.isSelecting = false;
  store.terminal.selectionStart = null;
  store.terminal.selectionEnd = null;
}

