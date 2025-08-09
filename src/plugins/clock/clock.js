import { PluginBase } from '../base.js';
import { TEXT_COLOR, ACCENT_COLOR } from '../../services/theme.js';
import { layoutState } from '../../services/layout.js';
import { setCanvasFont } from '../../services/theme.js';
import { registerPlugin, setPluginHelpText } from '../registry.js';

export class ClockPlugin extends PluginBase {
  constructor(id, title = 'Clock', x = 10, y = 10, width = 200, height = 100) {
    super(id, 'clock', title, x, y, width, height, {
      'clock-format': (args, plugin) => {
        const value = args[0];
        if (!value) return `Clock ${plugin.title} uses ${plugin.state.is24h ? '24' : '12'}-hour format`;
        if (value === '12') plugin.state.is24h = false;
        else if (value === '24') plugin.state.is24h = true;
        else return 'Invalid format. Use 12 or 24';
        return `Clock ${plugin.title} set to ${plugin.state.is24h ? '24' : '12'}-hour format`;
      },
    });
    this.state.is24h = true;
    this.state.timezoneOffsetMin = new Date().getTimezoneOffset();
  }

  drawContent(ctx) {
    ctx.fillStyle = TEXT_COLOR;
    setCanvasFont(ctx, layoutState.isCompact);
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    let display = '';
    if (this.state.is24h) {
      display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      const h12 = hours % 12 || 12;
      const ampm = hours < 12 ? 'AM' : 'PM';
      display = `${String(h12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${ampm}`;
    }
    ctx.fillText(display, this.x + 10, this.y + 45);

    // small accent bar at bottom
    ctx.fillStyle = ACCENT_COLOR;
    ctx.fillRect(this.x + 10, this.y + this.height - 12, this.width - 20, 2);
  }
}

// Self-register in central registry
registerPlugin('clock', ClockPlugin);
setPluginHelpText('clock', ['clock-format <id|name> [12|24]    Get or set time format (12|24)'].join('\n'));
