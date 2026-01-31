
import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { AppConfig, TodoItem } from '../types';
import { hexToRgba } from '../utils';

interface TodoListProps {
  config: AppConfig;
  onUpdate: (newConfig: AppConfig) => void;
}

export const TodoList: React.FC<TodoListProps> = ({ config, onUpdate }) => {
  const [inputText, setInputText] = useState('');

  if (!config.todo.enabled) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: inputText.trim(),
      completed: false
    };

    onUpdate({
      ...config,
      todos: [...config.todos, newTodo]
    });
    setInputText('');
  };

  const toggleTodo = (id: string) => {
    const updated = config.todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    onUpdate({ ...config, todos: updated });
  };

  const deleteTodo = (id: string) => {
    onUpdate({ ...config, todos: config.todos.filter(t => t.id !== id) });
  };

  const blurLevel = config.todo.blurLevel ?? 8;
  const opacityLevel = config.todo.opacityLevel ?? 0.6;
  const bgColor = config.todo.backgroundColor.startsWith('#') ? config.todo.backgroundColor : '#1a1a1a';
  const textColor = config.todo.textColor;

  return (
    <div 
      className="w-full p-6 border transition-all duration-300 shadow-sm"
      style={{
        borderColor: `${textColor}22`,
        borderRadius: config.theme.borderRadius,
        backgroundColor: hexToRgba(bgColor, opacityLevel),
        backdropFilter: `blur(${blurLevel}px)`,
        color: textColor
      }}
    >
      <h3 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-50">Tasks</h3>
      
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-transparent border-b outline-none text-sm py-1 placeholder-opacity-40"
          style={{ 
             borderColor: `${textColor}44`,
             color: textColor 
          }}
        />
        <button 
          type="submit"
          disabled={!inputText}
          className="opacity-50 hover:opacity-100 disabled:opacity-20 transition-opacity"
          style={{ color: config.theme.accentColor }}
        >
          <Plus size={20} />
        </button>
      </form>

      <div className="space-y-2">
        {config.todos.length === 0 && (
            <div className="text-xs opacity-30 text-center py-2 italic">Nothing to do yet.</div>
        )}
        {config.todos.map(todo => (
          <div 
            key={todo.id} 
            className="group flex items-center justify-between gap-3 text-sm py-1 hover:bg-white/5 rounded px-2 -mx-2 transition-colors"
          >
            <button 
              onClick={() => toggleTodo(todo.id)}
              className={`
                w-4 h-4 rounded-full border flex items-center justify-center transition-all
                ${todo.completed ? 'opacity-100' : 'opacity-40 hover:opacity-70'}
              `}
              style={{
                borderColor: todo.completed ? config.theme.accentColor : textColor,
                backgroundColor: todo.completed ? config.theme.accentColor : 'transparent'
              }}
            >
              {todo.completed && <Check size={10} className="text-black" strokeWidth={4} />}
            </button>
            
            <span 
              className={`flex-1 break-all transition-all ${todo.completed ? 'line-through opacity-40' : ''}`}
            >
              {todo.text}
            </span>

            <button 
              onClick={() => deleteTodo(todo.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
