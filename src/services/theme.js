export const ACCENT_COLOR = '#00ffaa';
export const TEXT_COLOR = '#ffffff';
export const BG_COLOR = '#1a1a1a';
export const FONT_FAMILY = 'monospace';

export function setCanvasFont(ctx, isCompact) {
  ctx.font = (isCompact ? '10px ' : '14px ') + FONT_FAMILY;
}

export function setTitleFont(ctx, isCompact) {
  ctx.font = (isCompact ? '12px ' : '16px ') + FONT_FAMILY;
}

