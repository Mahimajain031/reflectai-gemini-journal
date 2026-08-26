import React, { useState, useMemo } from 'react';
import { 
  JournalInteraction, 
  ReflectionMode 
} from '../types';
import { 
  Search, 
  Star, 
  Trash2, 
  Clock, 
  Sparkles, 
  MessageSquare, 
  Calendar,
  Filter,
  Tag as TagIcon
} from 'lucide-react';

interface HistoryListProps {
  interactions: JournalInteraction[];
  activeInteractionId: string | null;
  onSelectInteraction: (interaction: JournalInteraction) => void;
  onDeleteInteraction: (id: string) => Promise<void>;
  onToggleFavorite: (id: string, current: boolean) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  interactions,
  activeInteractionId,
  onSelectInteraction,
  onDeleteInteraction,
  onToggleFavorite,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    interactions.forEach((item) => {
      item.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [interactions]);

  // Filtered interactions
  const filtered = useMemo(() => {
    return interactions.filter((item) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesPrompt = item.initialPrompt?.toLowerCase().includes(query);
        const matchesResponse = item.latestResponse?.toLowerCase().includes(query);
        const matchesTag = item.tags?.some((t) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesPrompt && !matchesResponse && !matchesTag) {
          return false;
        }
      }

      // Mode filter
      if (selectedModeFilter !== 'all' && item.mode !== selectedModeFilter) {
        return false;
      }

      // Favorites filter
      if (onlyFavorites && !item.isFavorite) {
        return false;
      }

      // Tag filter
      if (selectedTag !== 'all' && !item.tags?.includes(selectedTag)) {
        return false;
      }

      return true;
    });
  }, [interactions, searchTerm, selectedModeFilter, onlyFavorites, selectedTag]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this reflection entry from Firestore?')) {
      try {
        setDeletingId(id);
        await onDeleteInteraction(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="history-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search past reflections, prompts, keywords..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Mode Dropdown */}
          <select
            id="history-mode-filter"
            value={selectedModeFilter}
            onChange={(e) => setSelectedModeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Modes</option>
            <option value="reflection">Daily Reflection</option>
            <option value="summary">Summary & Takeaways</option>
            <option value="brainstorm">Brainstorm & Action</option>
            <option value="clarity">Emotional Clarity</option>
          </select>

          {/* Favorites toggle */}
          <button
            id="history-fav-toggle"
            type="button"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              onlyFavorites
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : ''}`} />
            <span>Favorites</span>
          </button>
        </div>

        {/* Tag pills if any */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-gray-400 font-medium">Tags:</span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                selectedTag === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? 'all' : tag)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List items */}
      {filtered.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 space-y-2">
          <MessageSquare className="w-8 h-8 mx-auto text-gray-300" />
          <p className="text-sm font-medium text-gray-700">No reflections found</p>
          <p className="text-xs text-gray-400">
            {searchTerm || selectedModeFilter !== 'all' || onlyFavorites
              ? 'Try changing your search filters'
              : 'Write your first journal reflection to start saving history'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => {
            const isSelected = item.id === activeInteractionId;
            return (
              <div
                key={item.id}
                id={`history-item-${item.id}`}
                onClick={() => onSelectInteraction(item)}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all hover:shadow-xs relative group bg-white ${
                  isSelected
                    ? 'border-indigo-600 ring-1 ring-indigo-600 bg-indigo-50/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Title and Fav */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="space-y-0.5 flex-1 pr-2">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                      <span className="capitalize font-medium text-gray-700">{item.mode}</span>
                      <span>•</span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id, !!item.isFavorite);
                      }}
                      className={`p-1 rounded hover:bg-gray-100 ${
                        item.isFavorite ? 'text-amber-500' : 'text-gray-300'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, item.id)}
                      disabled={deletingId === item.id}
                      className="p-1 rounded text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete reflection"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prompt Preview */}
                <p className="text-xs text-gray-600 line-clamp-2 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  {item.initialPrompt}
                </p>

                {/* Footer stats */}
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {item.messages.length} {item.messages.length === 1 ? 'turn' : 'turns'}
                  </span>

                  <span className="font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded">
                    {item.modelUsed || 'gemini-3.6-flash'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
