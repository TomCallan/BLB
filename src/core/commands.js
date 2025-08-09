import { store } from './store.js';
import { calculateTerminalMetrics } from '../services/layout.js';

export const commandRegistry = {
  handlers: {},
  pluginCommandHandlers: {},
};

export function registerCommands(map) {
  Object.assign(commandRegistry.handlers, map);
}

export function updatePluginCommands() {
  const newMap = { ...coreCommands };
  const pluginCommandsByName = {};
  store.plugins.forEach((plugin) => {
    const entries = Object.entries(plugin.commands || {});
    entries.forEach(([cmd, handler]) => {
      if (!pluginCommandsByName[cmd]) pluginCommandsByName[cmd] = {};
      pluginCommandsByName[cmd][plugin.id] = handler;
      // Backward-compatible suffix form
      newMap[`${cmd}-${plugin.id}`] = (args) => handler(args, plugin);
    });
  });
  // Base dispatchers: <cmd> <id|name> [...args]
  Object.keys(pluginCommandsByName).forEach((cmd) => {
    newMap[cmd] = (args) => {
      const [idOrName, ...rest] = args;
      const target = findPluginByIdOrName(idOrName);
      if (!target) return `Plugin ${idOrName} not found`;
      const perPlugin = pluginCommandsByName[cmd] || {};
      const handler = perPlugin[target.id];
      if (!handler) return `Command ${cmd} not supported for ${target.type}`;
      return handler(rest, target);
    };
  });
  commandRegistry.handlers = newMap;
  commandRegistry.pluginCommandHandlers = pluginCommandsByName;
}

export function autocomplete(input, caretPosition) {
  const [cmdPart, ...args] = input.slice(0, caretPosition).split(' ');
  if (args.length === 0) {
    return Object.keys(commandRegistry.handlers).filter((c) => c.startsWith(cmdPart)).sort();
  }
  const idFirstCore = new Set(['remove', 'update', 'resize', 'move']);
  const needsPluginTarget = idFirstCore.has(cmdPart) || Boolean(commandRegistry.pluginCommandHandlers[cmdPart]);
  if (needsPluginTarget) {
    const prefix = args[0] || '';
    const pluginsForCmd = commandRegistry.pluginCommandHandlers[cmdPart]
      ? Object.keys(commandRegistry.pluginCommandHandlers[cmdPart]).map((id) => parseInt(id, 10))
      : store.plugins.map((p) => p.id);
    const candidates = store.plugins.filter((p) => pluginsForCmd.includes(p.id));
    const suggestions = candidates.map((p) => [String(p.id), p.title]).flat();
    return suggestions
      .filter((s) => s.toLowerCase().startsWith(prefix.toLowerCase()))
      .sort();
  }
  return [];
}

export function execute(input, canvas) {
  const t = store.terminal;
  t.history.push(input);
  t.historyIndex = t.history.length;
  t.caretPosition = 0;
  const [cmd, ...args] = input.trim().split(' ');
  const handler = commandRegistry.handlers[cmd] || (() => `Unknown command: ${cmd}`);
  const result = handler(args);
  const finish = (msg) => {
    if (msg) {
      t.output.push('');
      t.output.push(...String(msg).split('\n'));
      t.output.push('');
    }
    t.input = '';
    const { maxWidth } = calculateTerminalMetrics(canvas);
    // After output, scroll to bottom
    const wrapped = getWrappedOutputLines(canvas, maxWidth);
    const visibleOutputLines = Math.max(0, t.linesPerPage - Math.max(1, measureInputLines(canvas, maxWidth).length));
    const maxStartOffset = Math.max(0, wrapped.length - visibleOutputLines);
    t.outputLineOffset = maxStartOffset;
  };

  if (result && typeof result === 'object' && result.__async__ && result.type === 'load-json') {
    const url = result.url;
    t.output.push('');
    t.output.push(`Loading ${url} ...`);
    t.output.push('');
    try {
      fetch(url)
        .then((r) => r.json())
        .then((json) => {
          const ok = applyDashboard(json);
          updatePluginCommands();
          finish(ok ? `Loaded dashboard from ${url}` : `Failed to apply dashboard from ${url}`);
        })
        .catch((err) => {
          finish(`Failed to load ${url}: ${err && err.message ? err.message : String(err)}`);
        });
    } catch (err) {
      finish(`Failed to load ${url}: ${err && err.message ? err.message : String(err)}`);
    }
  } else {
    finish(result);
  }
}

import { getWrappedOutputLines, measureInputLines } from '../ui/terminal/paging.js';
import { coreCommands } from './core-commands.js';
import { applyDashboard } from '../services/persistence.js';

// initialize registry
registerCommands(coreCommands);

function findPluginByIdOrName(identifier) {
  const id = parseInt(identifier);
  if (!isNaN(id)) return store.plugins.find((p) => p.id === id);
  return store.plugins.find((p) => p.title.toLowerCase().includes(String(identifier).toLowerCase()));
}

