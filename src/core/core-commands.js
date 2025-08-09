import { store } from './store.js';
import { layoutState, calculateTerminalMetrics, setGridSize, toggleCompact, getGridSize } from '../services/layout.js';
import { updatePluginCommands } from './commands.js';
import { applyDashboard, serializeDashboard } from '../services/persistence.js';
import '../plugins/index.js';
import { getPluginConstructor, getPluginHelpText, getRegisteredPluginTypes } from '../plugins/index.js';

export const coreCommands = {
  help: (args) => {
    if (args.length === 0) {
      const loadedModules = Array.from(new Set(store.plugins.map((p) => p.type))).sort();
      const core = 'Core commands:\n' + Object.keys(coreCommands).sort().join(', ');
      const modulesList = 'Loaded modules:\n' + (loadedModules.length ? loadedModules.join('\n') : 'None');
      return `${core}\n\n${modulesList}`;
    }
    const pluginType = args[0].toLowerCase();
    return getPluginHelpText(pluginType) || `No module commands for type ${pluginType}`;
  },
  settings: (args) => {
    const sub = (args[0] || '').toLowerCase();
    if (!sub || sub === 'help') {
      return [
        'settings get <key>                Get a setting (gridSize, linesPerPage)',
        'settings set <key> <value>        Set a setting',
        'settings list                      List all settings',
      ].join('\n');
    }
    if (sub === 'list') {
      return [`gridSize ${getGridSize()}`, `linesPerPage ${store.terminal.linesPerPage}`].join('\n');
    }
    if (sub === 'get') {
      const key = (args[1] || '').toLowerCase();
      if (key === 'gridsize') return `gridSize ${getGridSize()}`;
      if (key === 'linesperpage') return `linesPerPage ${store.terminal.linesPerPage}`;
      return `Unknown setting ${key}`;
    }
    if (sub === 'set') {
      const key = (args[1] || '').toLowerCase();
      const value = args[2];
      if (key === 'gridsize') {
        if (setGridSize(value)) return `gridSize set to ${getGridSize()}`;
        return 'Invalid gridSize (10-500)';
      }
      if (key === 'linesperpage') {
        const v = parseInt(value, 10);
        if (Number.isFinite(v) && v >= 2 && v <= 50) {
          store.terminal.linesPerPage = v;
          return `linesPerPage set to ${v}`;
        }
        return 'Invalid linesPerPage (2-50)';
      }
      return `Unknown setting ${key}`;
    }
    return 'Invalid settings command';
  },
  save: () => {
    try {
      const json = JSON.stringify(serializeDashboard(), null, 2);
      return json;
    } catch (e) {
      return 'Failed to serialize dashboard';
    }
  },
  'load-json': (args) => {
    const url = args[0];
    if (!url) return 'Usage: load-json <url>';
    // The actual fetching is handled asynchronously by execute wrapper.
    return { __async__: true, type: 'load-json', url };
  },
  add: (args) => {
    const type = args[0] || 'todo';
    const title = args.slice(1).join(' ') || `Plugin ${store.plugins.length + 1}`;
    const Ctor = getPluginConstructor(type);
    if (!Ctor) return `Unknown module type: ${type}`;
    const plugin = new Ctor(store.plugins.length, title);
    store.plugins.push(plugin);
    updatePluginCommands();
    return `Added ${type} plugin: ${title}`;
  },
  list: () => {
    return (
      store.plugins.map((p) => `ID: ${p.id}, Type: ${p.type}, Title: ${p.title}`).join('\n') || 'No plugins'
    );
  },
  remove: (args) => {
    const idOrName = args[0];
    const plugin = findPluginByIdOrName(idOrName);
    if (!plugin) return `Plugin ${idOrName} not found`;
    store.plugins = store.plugins.filter((p) => p.id !== plugin.id);
    if (store.focusedPlugin && store.focusedPlugin.id === plugin.id) store.focusedPlugin = null;
    updatePluginCommands();
    return `Removed plugin ${plugin.title} (ID: ${plugin.id})`;
  },
  update: (args) => {
    const idOrName = args[0];
    const plugin = findPluginByIdOrName(idOrName);
    if (!plugin) return `Plugin ${idOrName} not found`;
    const data = JSON.parse(args.slice(1).join(' '));
    plugin.update(data);
    return `Updated plugin ${plugin.title} (ID: ${plugin.id})`;
  },
  compact: () => {
    const isCompact = toggleCompact();
    // linesPerPage will be recalculated by renderer on resize
    return `Compact mode: ${isCompact ? 'ON' : 'OFF'}`;
  },
  exit: () => {
    store.terminal.active = false;
    return '';
  },
  resize: (args) => {
    const plugin = findPluginByIdOrName(args[0]);
    const width = parseInt(args[1]);
    const height = parseInt(args[2]);
    if (plugin && !isNaN(width) && !isNaN(height)) {
      plugin.width = Math.max(150, Math.round(width / 50) * 50);
      plugin.height = Math.max(100, Math.round(height / 50) * 50);
      return `Resized plugin ${plugin.title} (ID: ${plugin.id}) to ${plugin.width}x${plugin.height}`;
    }
    return `Plugin ${args[0]} not found or invalid dimensions`;
  },
  move: (args) => {
    const plugin = findPluginByIdOrName(args[0]);
    const x = parseInt(args[1]);
    const y = parseInt(args[2]);
    if (plugin && !isNaN(x) && !isNaN(y)) {
      plugin.x = Math.round(x / 50) * 50;
      plugin.y = Math.round(y / 50) * 50;
      return `Moved plugin ${plugin.title} (ID: ${plugin.id}) to (${plugin.x}, ${plugin.y})`;
    }
    return `Plugin ${args[0]} not found or invalid coordinates`;
  },
  next: () => {
    const canvas = document.getElementById('dashboard');
    const { maxWidth } = calculateTerminalMetrics(canvas);
    const { visibleOutputLines, maxStartOffset } = getPagingInfo(canvas, maxWidth);
    const before = store.terminal.outputLineOffset;
    store.terminal.outputLineOffset = Math.min(before + (visibleOutputLines || 1), maxStartOffset);
    return store.terminal.outputLineOffset !== before ? 'Next' : 'No more pages';
  },
  prev: () => {
    const canvas = document.getElementById('dashboard');
    const { visibleOutputLines } = getPagingInfo(canvas, calculateTerminalMetrics(canvas).maxWidth);
    const before = store.terminal.outputLineOffset;
    store.terminal.outputLineOffset = Math.max(0, before - (visibleOutputLines || 1));
    return store.terminal.outputLineOffset !== before ? 'Prev' : 'Already at first page';
  },
};

function findPluginByIdOrName(identifier) {
  const id = parseInt(identifier);
  if (!isNaN(id)) return store.plugins.find((p) => p.id === id);
  return store.plugins.find((p) => p.title.toLowerCase().includes(String(identifier).toLowerCase()));
}

import { getPagingInfo } from '../ui/terminal/paging.js';

