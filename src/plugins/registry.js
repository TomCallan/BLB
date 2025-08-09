// Central plugin registry with self-registration support

// type -> constructor
const typeToConstructor = new Map();
// type -> help text (string)
const typeToHelp = new Map();

export function registerPlugin(type, constructor, options = {}) {
  if (!type || typeof type !== 'string') throw new Error('registerPlugin: type must be a non-empty string');
  if (typeof constructor !== 'function') throw new Error('registerPlugin: constructor must be a class/function');
  typeToConstructor.set(type, constructor);
  if (options.help) typeToHelp.set(type, String(options.help));
}

export function getPluginConstructor(type) {
  return typeToConstructor.get(type);
}

export function getRegisteredPluginTypes() {
  return Array.from(typeToConstructor.keys());
}

export function getPluginHelpText(type) {
  return typeToHelp.get(type) || null;
}

export function setPluginHelpText(type, helpText) {
  typeToHelp.set(type, String(helpText));
}

export const pluginRegistry = {
  registerPlugin,
  getPluginConstructor,
  getRegisteredPluginTypes,
  getPluginHelpText,
  setPluginHelpText,
};


