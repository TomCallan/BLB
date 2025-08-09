Terminology

Dashboard:

The entire application, rendered on an HTML5 <canvas> element, displaying a grid-based layout of plugins and a terminal interface.
Example: The full UI you interact with in the browser.


Plugin:

An individual, draggable, resizable window on the dashboard, representing a specific instance of a module (e.g., a specific Todo List window).
Each plugin has an id, type, title, position (x, y), size (width, height), and state (data specific to the plugin).
Example: A single Todo List window named “Tasks” with ID 0.


Module:

The type or class of a plugin, defining its behavior and commands (e.g., the todo module defines the Todo List functionality).
Modules are implemented as JavaScript classes (e.g., TodoPlugin) that extend the base Plugin class.
Example: The todo module provides commands like add-todo, remove-todo, and UI features like the “+” button for adding tasks.


Terminal:

The command-line interface at the bottom of the dashboard, toggleable with the Esc key.
Supports commands, tab completion, a blinking caret, left/right arrow navigation, command history, and paginated output.
Example: Typing help or add-todo-0 Buy groceries in the terminal.


Command:

An instruction entered in the terminal to interact with the dashboard or plugins.
Core Commands: Built-in commands for general dashboard control (e.g., help, add, remove, resize, move, compact, exit, next, prev).
Module Commands: Commands specific to a module, executed for a specific plugin instance (e.g., add-todo-0 for the Todo Plugin with ID 0).
Example: list (core command), list-todos-0 (module command for Todo Plugin ID 0).


Core Commands:

Commands that manage the dashboard itself, not tied to specific plugins or modules.
Example: add todo My Tasks creates a new Todo Plugin, compact toggles UI density.


Module Commands:

Commands defined by a module, dynamically loaded by plugins and executed with an instance-specific suffix (e.g., add-todo-0).
Listed in help at the module level (e.g., add-todo, not add-todo-0).
Example: add-todo-0 Buy groceries adds a task to the Todo Plugin with ID 0.


Plugin Instance:

A specific instance of a module on the dashboard, identified by a unique id and title.
Example: A Todo Plugin with id: 0 and title: Tasks is one instance of the todo module.


State:

The data associated with a plugin instance, stored in plugin.state.
Example: For a Todo Plugin, state.todos holds the list of tasks (e.g., [{ text: "Buy groceries", completed: false }]).


Grid:

The invisible layout system that plugins snap to when moved or resized, defined by GRID_SIZE (50px).
Example: Dragging a plugin snaps its position to multiples of 50px.


Caret:

The blinking vertical bar (|) in the terminal input area, showing the typing position.
Example: In > add-t|odo, the caret is between “t” and “o”.


Output Page:

A subset of the terminal’s output buffer, displayed based on the current outputPage and linesPerPage (5 in compact mode, 8 in expanded mode).
Example: Use next/prev commands to navigate output pages.


Focus:

The currently active element receiving keyboard input: either the terminal or a plugin.
Example: Clicking a Todo Plugin sets focusedPlugin, enabling task input; Esc sets focus to the terminal.



Usage Examples with Terminology

Create a Plugin: add todo My Tasks creates a new plugin instance of the todo module with title “My Tasks”.
View Commands: help lists core commands and module commands (e.g., todo: add-todo, remove-todo).
Module-Specific Help: help todo shows todo module commands: add-todo, remove-todo, list-todos, toggle-todo.
Run a Module Command: add-todo-0 Buy groceries adds a task to the todo plugin with ID 0.
Navigate Terminal Output: Use next/prev to scroll through output pages in the terminal.
Interact with Plugin: Click the “+” button in a todo plugin to add a task, or click a task to toggle its completion state.

Notes

When referring to commands, use the module-level name for clarity (e.g., add-todo) unless specifying a plugin instance (e.g., add-todo-0).
For plugin selection, you can use either the plugin’s id (e.g., 0) or title (e.g., Tasks) in commands like remove Tasks or resize 0 300 200.
The terminal’s output is paginated, and the caret indicates where text will be inserted.