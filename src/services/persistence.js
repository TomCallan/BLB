import { store } from '../core/store.js';
import { layoutState, getGridSize, setGridSize } from './layout.js';
import { TodoPlugin } from '../plugins/todo/todo.js';
import { ClockPlugin } from '../plugins/clock/clock.js';

const LOCAL_STORAGE_KEY = 'dashphp_state_v1';

function pluginToSerializable(plugin) {
  return {
    id: plugin.id,
    type: plugin.type,
    title: plugin.title,
    x: plugin.x,
    y: plugin.y,
    width: plugin.width,
    height: plugin.height,
    state: JSON.parse(JSON.stringify(plugin.state || {})),
  };
}

export function serializeDashboard() {
  return {
    layout: {
      gridSize: getGridSize(),
      isCompact: layoutState.isCompact,
    },
    plugins: store.plugins.map(pluginToSerializable),
  };
}

function createPluginFromSerialized(p) {
  const { id, type, title, x, y, width, height, state } = p;
  let pluginInstance = null;
  if (type === 'todo') {
    pluginInstance = new TodoPlugin(id, title, x, y, width, height);
  } else if (type === 'clock') {
    pluginInstance = new ClockPlugin(id, title, x, y, width, height);
  }
  if (!pluginInstance) return null;
  // Apply state
  try {
    Object.assign(pluginInstance.state, state || {});
    if (typeof pluginInstance.update === 'function') {
      pluginInstance.update(state || {});
    }
  } catch (_) {
    // best-effort
  }
  return pluginInstance;
}

export function applyDashboard(state) {
  if (!state || typeof state !== 'object') return false;
  try {
    const { layout, plugins } = state;
    if (layout) {
      if (layout.gridSize != null) setGridSize(layout.gridSize);
      if (typeof layout.isCompact === 'boolean') layoutState.isCompact = layout.isCompact;
    }
    store.plugins.length = 0;
    const instances = (plugins || [])
      .map(createPluginFromSerialized)
      .filter(Boolean);
    // Ensure unique, stable ids in order
    instances.forEach((p, idx) => {
      p.id = idx;
      store.plugins.push(p);
    });
    return true;
  } catch (_) {
    return false;
  }
}

export function saveToLocalStorage() {
  try {
    const data = serializeDashboard();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (_) {
    return false;
  }
}

export function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return applyDashboard(parsed);
  } catch (_) {
    return false;
  }
}

export function persist() {
  return saveToLocalStorage();
}


