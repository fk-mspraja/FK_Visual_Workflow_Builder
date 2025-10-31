'use client';

import { useState } from 'react';
import { ACTION_BLOCKS, ACTION_CATEGORIES, getCategoryInfo } from '@/lib/actions';

interface SidebarProps {
  onDragStart: (event: React.DragEvent, actionId: string) => void;
}

export default function Sidebar({ onDragStart }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter actions based on search and category
  const filteredActions = Object.values(ACTION_BLOCKS).filter((action) => {
    const matchesSearch =
      searchQuery === '' ||
      action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null || action.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedActions: Record<string, typeof filteredActions> = {};
  filteredActions.forEach((action) => {
    if (!groupedActions[action.category]) {
      groupedActions[action.category] = [];
    }
    groupedActions[action.category].push(action);
  });

  const categories = Object.values(ACTION_CATEGORIES);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Action Blocks</h2>

        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Action Blocks */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedActions).map(([category, actions]) => {
          const categoryInfo = getCategoryInfo(category);
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-xl">{categoryInfo.icon}</div>
                <h3 className="text-sm font-semibold text-gray-700">{category}</h3>
                <span className="text-xs text-gray-500">({actions.length})</span>
              </div>
              <div className="space-y-2">
                {actions.map((action) => (
                  <div
                    key={action.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, action.id)}
                    className="group cursor-move bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center text-sm group-hover:scale-110 transition-transform`}
                      >
                        {action.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {action.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {action.action_count} action{action.action_count > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {action.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredActions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm text-gray-500">No actions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
