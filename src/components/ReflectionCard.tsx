import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { 
  Copy, 
  Check, 
  Tag, 
  Star, 
  Share2, 
  Sparkles, 
  User, 
  Bot, 
  Clock, 
  Send,
  Download,
  AlertCircle
} from 'lucide-react';
import { JournalInteraction, InteractionMessage } from '../types';

interface ReflectionCardProps {
  interaction: JournalInteraction;
  onSendFollowUp: (followUpText: string) => Promise<void>;
  onToggleFavorite: (id: string, current: boolean) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  isGenerating: boolean;
}

export const ReflectionCard: React.FC<ReflectionCardProps> = ({
  interaction,
  onSendFollowUp,
  onToggleFavorite,
  onAddTag,
  onRemoveTag,
  isGenerating,
}) => {
  const [copied, setCopied] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  const handleCopy = async () => {
    const fullConversation = interaction.messages
      .map((m) => `${m.role === 'user' ? '### User Prompt' : '### Gemini Reflection'}\n${m.text}`)
      .join('\n\n---\n\n');

    await navigator.clipboard.writeText(fullConversation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    const fullContent = `# ${interaction.title}\n\n*Created: ${new Date(interaction.createdAt).toLocaleString()}*\n*Mode: ${interaction.mode}*\n*Model: ${interaction.modelUsed}*\n\n` +
      interaction.messages
        .map((m) => `## ${m.role === 'user' ? 'Reflection Prompt' : 'Gemini Response'}\n\n${m.text}`)
        .join('\n\n---\n\n');

    const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${interaction.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || isGenerating) return;
    const textToSend = followUpText.trim();
    setFollowUpText('');
    await onSendFollowUp(textToSend);
  };

  const handleAddTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    onAddTag(interaction.id, newTagInput.trim());
    setNewTagInput('');
    setShowTagInput(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col transition-all">
      {/* Header bar */}
      <div className="px-5 py-4 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 tracking-tight">
              {interaction.title}
            </h2>
            <button
              id={`fav-btn-${interaction.id}`}
              onClick={() => onToggleFavorite(interaction.id, !!interaction.isFavorite)}
              className={`p-1 rounded-md transition-colors ${
                interaction.isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={interaction.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-4 h-4 ${interaction.isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(interaction.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span>•</span>
            <span className="capitalize font-medium text-gray-700">{interaction.mode} mode</span>
            <span>•</span>
            <span className="font-mono text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded">
              {interaction.modelUsed || 'gemini-3.6-flash'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            id={`copy-btn-${interaction.id}`}
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-medium transition-colors shadow-xs"
            title="Copy entire conversation to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            id={`export-btn-${interaction.id}`}
            onClick={handleExportMarkdown}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-medium transition-colors shadow-xs"
            title="Export as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="p-5 sm:p-6 space-y-6 divide-y divide-gray-100">
        {interaction.messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id || index}
              className={`pt-5 first:pt-0 flex gap-4 ${isUser ? 'items-start' : 'items-start'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-gray-100 text-gray-700 border border-gray-200'
                    : 'bg-indigo-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content */}
              <div className="flex-1 space-y-2 overflow-hidden">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-gray-800">
                    {isUser ? 'Your Journal Prompt' : 'Gemini Reflection & Analysis'}
                  </span>
                  <span className="text-[11px]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {isUser ? (
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {msg.text}
                  </div>
                ) : (
                  <div className="prose prose-gray prose-sm max-w-none text-gray-800 leading-relaxed space-y-3 bg-white p-2">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading placeholder during generation */}
        {isGenerating && (
          <div className="pt-5 flex gap-4 items-start animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">Gemini 3.6 Flash is reflecting...</span>
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        )}
      </div>

      {/* Tags Section */}
      <div className="px-5 py-3 bg-gray-50/60 border-t border-gray-200 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
          <Tag className="w-3 h-3" /> Tags:
        </span>
        {interaction.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium"
          >
            #{tag}
            <button
              onClick={() => onRemoveTag(interaction.id, tag)}
              className="text-gray-400 hover:text-gray-700 ml-0.5"
            >
              ×
            </button>
          </span>
        ))}

        {showTagInput ? (
          <form onSubmit={handleAddTagSubmit} className="inline-flex items-center gap-1">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              placeholder="Tag name"
              className="text-xs px-2 py-0.5 rounded border border-gray-300 w-24 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              className="text-xs px-2 py-0.5 rounded bg-indigo-600 text-white font-medium shadow-xs"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowTagInput(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowTagInput(true)}
            className="text-xs text-gray-500 hover:text-gray-800 font-medium px-1.5 py-0.5 rounded hover:bg-gray-200/50"
          >
            + Add Tag
          </button>
        )}
      </div>

      {/* Multi-turn Follow-up composer */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <form onSubmit={handleFollowUpSubmit} className="flex items-center gap-2">
          <input
            id={`followup-input-${interaction.id}`}
            type="text"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            disabled={isGenerating}
            placeholder="Ask a follow-up, explore deeper insights, or brainstorm next steps..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
          />
          <button
            id={`followup-send-${interaction.id}`}
            type="submit"
            disabled={!followUpText.trim() || isGenerating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Continue</span>
          </button>
        </form>
      </div>
    </div>
  );
};
