import { store } from './store.js';
import { BG_COLOR } from '../services/theme.js';
import { drawTerminal } from '../ui/terminal/terminal.js';

export function renderFrame(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  store.plugins.forEach((plugin) => {
    const isFocused = store.focusedPlugin && store.focusedPlugin.id === plugin.id;
    plugin.draw(ctx, isFocused);
  });

  drawTerminal(canvas);
}

