import { PluginBase } from '../base.js';
import { ACCENT_COLOR, TEXT_COLOR } from '../../services/theme.js';
import { layoutState } from '../../services/layout.js';
import { setCanvasFont } from '../../services/theme.js';

export class TodoPlugin extends PluginBase {
  constructor(id, title, x = 10, y = 10, width = 200, height = 150) {
    super(id, 'todo', title, x, y, width, height, {
      'add-todo': (args, plugin) => {
        const task = args.join(' ');
        if (task) {
          plugin.state.todos.push({ text: task, completed: false });
          return `Added task to ${plugin.title}: ${task}`;
        }
        return 'Task cannot be empty';
      },
      'remove-todo': (args, plugin) => {
        const index = parseInt(args[0]);
        if (plugin.state.todos[index]) {
          plugin.state.todos.splice(index, 1);
          return `Removed task ${index} from ${plugin.title}`;
        }
        return `Task ${index} not found in ${plugin.title}`;
      },
      'list-todos': (args, plugin) => {
        return (
          plugin.state.todos
            .map((t, i) => `${i}: ${t.text} ${t.completed ? '[x]' : '[ ]'}`)
            .join('\n') || 'No tasks'
        );
      },
      'toggle-todo': (args, plugin) => {
        const index = parseInt(args[0]);
        if (plugin.state.todos[index]) {
          plugin.state.todos[index].completed = !plugin.state.todos[index].completed;
          return `Toggled task ${index} in ${plugin.title}`;
        }
        return `Task ${index} not found in ${plugin.title}`;
      },
    });
    this.state.todos = [];
    this.state.input = '';
    this.state.isAdding = false;
  }

  drawContent(ctx, isFocused) {
    ctx.fillStyle = TEXT_COLOR;
    setCanvasFont(ctx, layoutState.isCompact);
    let yOffset = 35;

    this.state.todos.forEach((todo, i) => {
      ctx.fillStyle = todo.completed ? '#888888' : TEXT_COLOR;
      if (todo.completed) {
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + yOffset + 5);
        ctx.lineTo(this.x + this.width - 10, this.y + yOffset + 5);
        ctx.strokeStyle = '#888888';
        ctx.stroke();
      }
      ctx.fillText(`- ${todo.text}`, this.x + 10, this.y + yOffset);
      yOffset += layoutState.isCompact ? 15 : 20;
    });

    ctx.fillStyle = ACCENT_COLOR;
    ctx.fillRect(this.x + this.width - 30, this.y + this.height - 20, 20, 15);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('+', this.x + this.width - 25, this.y + this.height - 8);

    if (this.state.isAdding) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(this.x + 10, this.y + yOffset, this.width - 20, 20);
      ctx.strokeStyle = ACCENT_COLOR;
      ctx.strokeRect(this.x + 10, this.y + yOffset, this.width - 20, 20);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(this.state.input || 'Enter task...', this.x + 15, this.y + yOffset + 15);
    }
  }

  update(data) {
    if (data.todos) this.state.todos = data.todos;
  }

  isPointInAddButton(x, y) {
    return (
      x >= this.x + this.width - 30 &&
      x <= this.x + this.width - 10 &&
      y >= this.y + this.height - 20 &&
      y <= this.y + this.height - 5
    );
  }

  isPointInTodo(x, y, index) {
    const yOffset = 35 + index * (layoutState.isCompact ? 15 : 20);
    return (
      x >= this.x &&
      x <= this.x + this.width &&
      y >= this.y + yOffset - 10 &&
      y <= this.y + yOffset + 10
    );
  }

  onMouseDown(x, y) {
    if (this.isPointInAddButton(x, y)) {
      this.state.isAdding = true;
      return true;
    }
    for (let j = 0; j < this.state.todos.length; j++) {
      if (this.isPointInTodo(x, y, j)) {
        this.state.todos[j].completed = !this.state.todos[j].completed;
        return true;
      }
    }
    return false;
  }

  onKeyDown(e) {
    if (!this.state.isAdding) return false;
    if (e.key === 'Enter') {
      if (this.state.input) {
        this.state.todos.push({ text: this.state.input, completed: false });
        this.state.input = '';
        this.state.isAdding = false;
      }
      return true;
    } else if (e.key === 'Backspace') {
      this.state.input = this.state.input.slice(0, -1);
      return true;
    } else if (e.key.length === 1) {
      this.state.input += e.key;
      return true;
    }
    return false;
  }
}

