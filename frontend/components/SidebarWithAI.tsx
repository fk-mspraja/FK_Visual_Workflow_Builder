'use client';

import { useState, useEffect } from 'react';
import { ACTION_BLOCKS, ACTION_CATEGORIES, getCategoryInfo } from '@/lib/actions';
import { getActionIcon } from '@/lib/iconMap';

interface SidebarWithAIProps {
  onDragStart: (event: React.DragEvent, actionId: string) => void;
  recommendedBlocks?: string[];
}

export default function SidebarWithAI({ onDragStart, recommendedBlocks = [] }: SidebarWithAIProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(false);
  const [showAll, setShowAll] = useState(true);

  // Auto-show recommended when AI provides suggestions
  useEffect(() => {
    if (recommendedBlocks.length > 0) {
      setShowOnlyRecommended(true);
      setShowAll(false);
    }
  }, [recommendedBlocks]);

  // Filter actions based on search, category, and AI recommendations
  const filteredActions = Object.values(ACTION_BLOCKS).filter((action) => {
    const matchesSearch =
      searchQuery === '' ||
      action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === null || action.category === selectedCategory;

    const matchesRecommended =
      !showOnlyRecommended || recommendedBlocks.includes(action.id);

    const matchesShowAll = showAll || matchesRecommended || matchesSearch || matchesCategory;

    return matchesSearch && matchesCategory && matchesRecommended && matchesShowAll;
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

  const handleShowAllToggle = () => {
    setShowAll(!showAll);
    if (!showAll) {
      setShowOnlyRecommended(false);
    }
  };

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
            className="w-full px-4 py-2 pl-10 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

        {/* AI Recommendations Banner */}
        {recommendedBlocks.length > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span className="text-xs font-semibold text-purple-900">
                AI Recommended ({recommendedBlocks.length})
              </span>
            </div>
            <button
              onClick={() => setShowOnlyRecommended(!showOnlyRecommended)}
              className={`w-full text-xs px-3 py-1.5 rounded-md transition-colors ${
                showOnlyRecommended
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-purple-700 border border-purple-300'
              }`}
            >
              {showOnlyRecommended ? 'Showing Recommended Only' : 'Show Recommended Only'}
            </button>
          </div>
        )}

        {/* Show All Toggle */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">View Mode:</span>
          <button
            onClick={handleShowAllToggle}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              showAll
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            {showAll ? 'All Blocks' : 'Filtered'}
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
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
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
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

      {/* Action Blocks List */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.keys(groupedActions).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 20h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No actions found</p>
            {!showAll && (
              <button
                onClick={handleShowAllToggle}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Show all blocks
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedActions)
              .sort()
              .map((category) => {
                const categoryInfo = getCategoryInfo(category);
                return (
                  <div key={category}>
                    {/* Category Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{categoryInfo.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                          {category}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{categoryInfo.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">({groupedActions[category].length})</span>
                    </div>

                    {/* Action Cards */}
                    <div className="space-y-2">
                      {groupedActions[category].map((action) => {
                        const isRecommended = recommendedBlocks.includes(action.id);
                        return (
                          <div
                            key={action.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, action.id)}
                            className={`group cursor-move bg-white border-2 rounded-lg p-3 transition-all hover:shadow-lg hover:scale-105 ${
                              isRecommended
                                ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50'
                                : 'border-gray-200 hover:border-blue-400'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 text-blue-600">
                                {getActionIcon(action.id, 'w-6 h-6')}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                                    {action.name}
                                  </h4>
                                  {isRecommended && (
                                    <span className="flex-shrink-0 px-1.5 py-0.5 text-xs font-medium text-purple-700 bg-purple-200 rounded">
                                      AI
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {action.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-gray-500">
                                    {action.action_count} action{action.action_count > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
