import { store } from './store.js';
import { renderFrame } from './renderer.js';
import { attachInputHandlers } from './input.js';
import { TodoPlugin } from '../plugins/todo/todo.js';
import { ClockPlugin } from '../plugins/clock/clock.js';
import { updatePluginCommands } from './commands.js';
import { loadFromLocalStorage, saveToLocalStorage, serializeDashboard } from '../services/persistence.js';

const canvas = document.getElementById('dashboard');

// caret blink
setInterval(() => {
  store.terminal.caretVisible = !store.terminal.caretVisible;
}, 500);

// initial plugins or load from local storage
const restored = loadFromLocalStorage();
if (!restored) {
  store.plugins.push(new TodoPlugin(0, 'Tasks', 10, 10, 200, 150));
  store.plugins.push(new ClockPlugin(1, 'Clock', 220, 10, 200, 100));
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

