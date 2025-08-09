import { ACCENT_COLOR, TEXT_COLOR } from '../services/theme.js';
import { layoutState, MIN_HEIGHT, MIN_WIDTH } from '../services/layout.js';
import { setTitleFont } from '../services/theme.js';

export class PluginBase {
  constructor(id, type, title, x, y, width, height, commands = {}) {
    this.id = id;
    this.type = type;
    this.title = title;
    this.x = x;
    this.y = y;
    this.width = Math.max(MIN_WIDTH, width);
    this.height = Math.max(MIN_HEIGHT, height);
    this.state = {};
    this.commands = commands;
  }

  // Default draw implementation calls frame + content hook
  draw(ctx, isFocused) {
    this.drawFrame(ctx, isFocused);
    this.drawContent(ctx, isFocused);
  }

  drawFrame(ctx, isFocused) {
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = isFocused ? '#ff0000' : ACCENT_COLOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = ACCENT_COLOR;
    ctx.fillRect(this.x, this.y, this.width, 20);
    ctx.fillStyle = TEXT_COLOR;
    setTitleFont(ctx, layoutState.isCompact);
    ctx.fillText(this.title, this.x + 5, this.y + 15);
  }

  // Hook for subclasses to draw their content inside the frame
  // Default does nothing
  drawContent(ctx, isFocused) {}

  isPointInside(x, y) {
    return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
  }

  isPointInResizeHandle(x, y) {
    return (
      x >= this.x + this.width - 10 &&
      x <= this.x + this.width &&
      y >= this.y + this.height - 10 &&
      y <= this.y + this.height
    );
  }

  // Content bounds helper (excludes title bar)
  getContentBounds() {
    const titleBarHeight = 20;
    return { x: this.x, y: this.y + titleBarHeight, width: this.width, height: this.height - titleBarHeight };
  }

  // Event hooks to simplify plugin development
  // Return true if the event was handled and should not propagate
  onMouseDown(x, y) { return false; }
  onMouseMove(x, y) { return false; }
  onMouseUp() { return false; }
  onKeyDown(e) { return false; }
}

