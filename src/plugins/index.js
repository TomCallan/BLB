// Auto-load plugins declared in manifest (side-effect registration)
import { pluginModules } from './manifest.js';
await Promise.all(pluginModules.map((m) => import(m)));

// Re-export registry helpers for consumers and self-registration API
export {
  registerPlugin,
  getPluginConstructor,
  getRegisteredPluginTypes,
  getPluginHelpText,
  setPluginHelpText,
  pluginRegistry,
} from './registry.js';


