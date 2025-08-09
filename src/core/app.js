import { store } from './store.js';
import { renderFrame } from './renderer.js';
import { attachInputHandlers } from './input.js';
import { updatePluginCommands } from './commands.js';
import { loadFromLocalStorage, saveToLocalStorage, serializeDashboard } from '../services/persistence.js';
import '../plugins/index.js';
import { getPluginConstructor } from '../plugins/index.js';

const canvas = document.getElementById('dashboard');

// caret blink
setInterval(() => {
  store.terminal.caretVisible = !store.terminal.caretVisible;
}, 500);

// initial plugins or load from local storage
const restored = loadFromLocalStorage();
if (!restored) {
  const TodoCtor = getPluginConstructor('todo');
  const ClockCtor = getPluginConstructor('clock');
  if (TodoCtor) store.plugins.push(new TodoCtor(0, 'Tasks', 10, 10, 200, 150));
  if (ClockCtor) store.plugins.push(new ClockCtor(1, 'Clock', 220, 10, 200, 100));
}
updatePluginCommands();

attachInputHandlers(canvas);

function loop() {
  renderFrame(canvas);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Autosave when state changes (lightweight diff by JSON string compare)
let lastSaved = '';
setInterval(() => {
  try {
    const current = JSON.stringify(serializeDashboard());
    if (current !== lastSaved) {
      saveToLocalStorage();
      lastSaved = current;
    }
  } catch (_) {
    // ignore
  }
}, 1000);

