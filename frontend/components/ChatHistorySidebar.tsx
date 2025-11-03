'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Search,
  Plus
} from 'lucide-react';
import { chatHistoryDB, ChatSession } from '../lib/chatHistory';

interface ChatHistorySidebarProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export function ChatHistorySidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: ChatHistorySidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, [filter]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      await chatHistoryDB.init();
      const loadedSessions = filter === 'completed'
        ? await chatHistoryDB.getCompletedSessions()
        : await chatHistoryDB.getAllSessions();
      setSessions(loadedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Delete this chat session?')) {
      try {
        await chatHistoryDB.deleteSession(sessionId);
        onDeleteSession(sessionId);
        loadSessions();
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(msg =>
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 280 }}
        animate={{ width: 60 }}
        className="h-full bg-white border-r border-gray-200 flex flex-col items-center py-4"
      >
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={onNewChat}
          className="mt-4 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          title="New chat"
        >
          <Plus className="w-5 h-5" />
        </button>

        <div className="mt-6 flex-1 w-full px-2 space-y-2 overflow-y-auto">
          {sessions.slice(0, 10).map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full p-3 rounded-lg transition-all ${
                currentSessionId === session.id
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'hover:bg-gray-100'
              }`}
              title={session.title}
            >
              <MessageSquare className="w-5 h-5 text-gray-600 mx-auto" />
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ width: 60 }}
      animate={{ width: 280 }}
      className="h-full bg-white border-r border-gray-200 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Chat History</h2>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Search & Filter */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'completed'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {searchQuery ? 'No matching chats found' : 'No chat history yet'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Start a new conversation to begin
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {filteredSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                    currentSessionId === session.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                  onClick={() => onSelectSession(session.id)}
                >
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>

                  {/* Title */}
                  <div className="flex items-start gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate pr-8">
                        {session.title}
                      </h3>
                    </div>
                  </div>

                  {/* Preview */}
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2 ml-6">
                    {session.messages[session.messages.length - 1]?.content.substring(0, 80) || 'No messages'}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between ml-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(session.updatedAt)}
                      </span>
                    </div>

                    {session.isCompleted && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-green-50 rounded-full">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">Done</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Count */}
                  {session.detectedActions.length > 0 && (
                    <div className="mt-2 ml-6">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded text-xs text-blue-700 font-medium">
                        <span>{session.detectedActions.length} action{session.detectedActions.length > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          {filteredSessions.length} chat{filteredSessions.length !== 1 ? 's' : ''}
        </div>
      </div>
    </motion.div>
  );
}
