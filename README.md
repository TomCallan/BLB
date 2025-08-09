## BLB Module Development Guide

This guide explains how to build, wire, and ship new modules ("plugins") for the dashboard.

### Overview
- **Rendering model**: Each module subclasses `PluginBase` and draws into the canvas.
- **State**: Keep module state on `this.state`; it is auto-serialized to localStorage.
- **Commands**: Expose module features to the in-canvas terminal via a commands map.
- **Interaction**: Optional mouse and keyboard hooks let your module handle input.

Open the terminal with `/` and use core commands like `add`, `list`, `remove`, `move`, `resize`, `save`, `load-json`.

### File layout
Create your module here:
- `src/plugins/<type>/<type>.js` — export your plugin class

Existing examples:
- `src/plugins/todo/todo.js`
- `src/plugins/clock/clock.js`

### Base class API
Extend `PluginBase` from `src/plugins/base.js`.

Call `super(...)` with:
- `(id, type, title, x, y, width, height, commands = {})`

Helpful members and hooks:
- `this.state`: object for your module state (serialized automatically)
- `draw(ctx, isFocused)`: calls `drawFrame` + `drawContent`
- `drawContent(ctx, isFocused)`: override to draw your content
- `getContentBounds()`: returns `{ x, y, width, height }` below the title bar
- Event hooks: `onMouseDown(x, y)`, `onMouseMove(x, y)`, `onMouseUp()`, `onKeyDown(e)` (return `true` if handled)
- Hit testing helpers: `isPointInside(x, y)`, `isPointInResizeHandle(x, y)`

Styling helpers:
- From `src/services/theme.js`: `TEXT_COLOR`, `ACCENT_COLOR`, `setCanvasFont`, `setTitleFont`
- From `src/services/layout.js`: `layoutState.isCompact`

### Command API
Pass a commands map to `super(...)`: `{ 'cmd-name': (args, plugin) => string }`.

Command dispatch works two ways automatically:
- `<cmd> <id|name> [args...]` — generic dispatcher resolves target by id or title substring
- `<cmd>-<id> [args...]` — per-instance alias

Return a string (or multi-line string) to print to the terminal.

### Persistence
State is auto-saved via `serializeDashboard()` in `src/services/persistence.js`.
- Anything under `plugin.state` is persisted.
- If you implement `update(data)`, it will be called with hydrated state during load so you can derive fields.

 ### Registry and auto-loading
 The system uses a central registry with self-registration and a manifest to auto-load plugins at startup:
 - `src/plugins/registry.js`: provides `registerPlugin(type, Ctor, options)` and help text helpers
 - `src/plugins/manifest.js`: a list of plugin module paths to import
 - `src/plugins/index.js`: imports all modules from the manifest (side effects), then re-exports the registry helpers

 You do not need to modify persistence or core commands when adding a new plugin.
 They resolve constructors and help text dynamically via the registry.

 ### Wiring a new module type
 1) Implement your class file, e.g. `src/plugins/weather.js` or `src/plugins/weather/weather.js`
 2) At the bottom of your plugin file, self-register it:
    ```js
    import { registerPlugin, setPluginHelpText } from '../registry.js'; // adjust path if flat file
    registerPlugin('weather', WeatherPlugin);
    setPluginHelpText('weather', [
      'weather-set-city <id|name> <city>',
      'weather-info <id|name>',
    ].join('\n'));
    ```
 3) Add the module path once to `src/plugins/manifest.js` so it auto-loads:
    ```js
    export const pluginModules = [
      './todo/todo.js',
      './clock/clock.js',
      './weather.js', // <- add your plugin here
    ];
    ```
 4) (Optional) Add a default instance in `src/core/app.js` by calling `getPluginConstructor('weather')`

### Example: skeleton plugin
```js
// src/plugins/weather/weather.js
import { PluginBase } from '../base.js';
import { TEXT_COLOR, ACCENT_COLOR } from '../../services/theme.js';
import { layoutState } from '../../services/layout.js';
import { setCanvasFont } from '../../services/theme.js';

export class WeatherPlugin extends PluginBase {
  constructor(id, title = 'Weather', x = 10, y = 10, width = 220, height = 120) {
    super(id, 'weather', title, x, y, width, height, {
      'weather-set-city': (args, plugin) => {
        const city = args.join(' ').trim();
        if (!city) return 'Usage: weather-set-city <id|name> <city>';
        plugin.state.city = city;
        return `City set to ${city}`;
      },
      'weather-info': (args, plugin) => {
        return `Weather ${plugin.title}: city=${plugin.state.city || 'N/A'}`;
      },
    });
    this.state.city = 'London';
    this.state.tempC = null;
  }

  drawContent(ctx) {
    ctx.fillStyle = TEXT_COLOR;
    setCanvasFont(ctx, layoutState.isCompact);
    const { x, y, width, height } = this.getContentBounds();
    ctx.fillText(`City: ${this.state.city}`, x + 10, y + 25);

    // Accent divider near bottom of content area
    ctx.fillStyle = ACCENT_COLOR;
    ctx.fillRect(x + 10, y + height - 12, width - 20, 2);
  }

  update(data) {
    if (typeof data.city === 'string') this.state.city = data.city;
    if (typeof data.tempC === 'number') this.state.tempC = data.tempC;
  }

  onMouseDown(x, y) {
    // Optional: interact with your content; return true if handled
    return false;
  }
}
```

 With the registry + manifest, no changes to persistence or core commands are necessary.

### Terminal and core commands quickref
- **Toggle terminal**: `/`
- **Create**: `add <type> [title...]`
- **List**: `list`
- **Remove**: `remove <id|name>`
- **Move**: `move <id|name> <x> <y>` (snaps to grid)
- **Resize**: `resize <id|name> <w> <h>` (snaps to grid)
- **Settings**: `settings list|get|set`
- **Save**: `save` (prints JSON)
- **Load**: `load-json <url>`
- **Paging**: `next`, `prev`, `Home`, `End`, `PageUp`, `PageDown`
- **Autocomplete**: `Tab` completes command or `<id|name>` targets

### Visual guidelines
- Title bar height is 20px; draw content within `getContentBounds()`
- Use `setCanvasFont` and `layoutState.isCompact` to adapt line heights
- Use `TEXT_COLOR` for text and `ACCENT_COLOR` for highlights/dividers

### Interaction guidelines
- Moving/resizing is handled by the framework; your hooks are only for content-specific interactions
- Return `true` from `on*` hooks to prevent dragging/resizing when you consume the event

### Testing checklist
- Add your module type to `add` and persistence
- Create an instance: `/` → `add <type> My Title`
- Confirm drawing, moving, resizing
- Test your commands via both forms: `<cmd> <id|name>`, `<cmd>-<id>`
- `save` and reload the page; verify state restores correctly

### Naming conventions
- `type` should be lowercase, e.g., `weather`, `stocks`
- Class names should be `PascalCase` + `Plugin`, e.g., `WeatherPlugin`

---
If you add capabilities that other modules can reuse, consider extending `PluginBase` or creating utilities in `src/services/`.
