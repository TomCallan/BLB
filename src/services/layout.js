export const GRID_SIZE_DEFAULT = 50;
export const MARGIN = 10;
export const MIN_WIDTH = 150;
export const MIN_HEIGHT = 100;

export const layoutState = {
  dynamicGridSize: GRID_SIZE_DEFAULT,
  isCompact: false,
};

export function setGridSize(size) {
  const v = Number(size);
  if (!Number.isFinite(v) || v < 10 || v > 500) return false;
  layoutState.dynamicGridSize = v;
  return true;
}

export function getGridSize() {
  return layoutState.dynamicGridSize;
}

export function toggleCompact() {
  layoutState.isCompact = !layoutState.isCompact;
  return layoutState.isCompact;
}

export function calculateTerminalMetrics(canvas) {
  const height = layoutState.isCompact ? 100 : 150;
  const lineHeight = layoutState.isCompact ? 15 : 20;
  const paddingTop = 20;
  const maxWidth = canvas.width - 20;
  return { height, lineHeight, paddingTop, maxWidth };
}

export function quantizeToGrid(value) {
  const g = getGridSize();
  return Math.round(value / g) * g;
}

