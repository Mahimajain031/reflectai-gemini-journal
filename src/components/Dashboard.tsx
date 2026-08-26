import React, { useState, useEffect } from 'react';
import { 
  UserProfile, 
  JournalInteraction, 
  ReflectionMode, 
  InteractionMessage 
} from '../types';
import { 
  subscribeToUserInteractions, 
  saveUserInteraction, 
  deleteUserInteraction 
} from '../firebase';
import { ModeSelector, MODES } from './ModeSelector';
import { ReflectionCard } from './ReflectionCard';
import { HistoryList } from './HistoryList';
import { SecurityBanner } from './SecurityBanner';
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  AlertTriangle, 
  PenTool, 
  BookOpen, 
  Plus,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  activeView: 'editor' | 'history';
  onToggleView: (view: 'editor' | 'history') => void;
  onUpdateEntriesCount: (count: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  activeView,
  onToggleView,
  onUpdateEntriesCount,
}) => {
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeInteraction, setActiveInteraction] = useState<JournalInteraction | null>(null);
  
  // Composer Form State
  const [promptText, setPromptText] = useState('');
  const [customFocus, setCustomFocus] = useState('');
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>('reflection');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Status & Error Management
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<{ interaction: JournalInteraction; error: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Subscribe to real-time user-isolated Firestore collection
  useEffect(() => {
    if (!user.uid) return;

    const unsubscribe = subscribeToUserInteractions(
      user.uid,
      (data) => {
        setInteractions(data);
        onUpdateEntriesCount(data.length);

        // Update active interaction if it was updated in Firestore
        if (activeInteraction) {
          const fresh = data.find((i) => i.id === activeInteraction.id);
          if (fresh) {
            setActiveInteraction(fresh);
          }
        }
      },
      (err) => {
        console.error('Subscription error:', err);
        setErrorMessage('Failed to connect to Firestore. Check your connection or rules.');
      }
    );

    return () => unsubscribe();
  }, [user.uid]);

  // Derive current placeholder based on selected mode
  const activeModeConfig = MODES.find((m) => m.id === selectedMode) || MODES[0];

  // Handler: Start a new clean reflection
  const handleStartNewEntry = () => {
    setActiveInteraction(null);
    setPromptText('');
    setCustomFocus('');
    setErrorMessage(null);
    setSaveError(null);
    onToggleView('editor');
  };

  // Handler: Submit Primary Journal Prompt to Gemini + Firestore
  const handleGenerateReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isGenerating) return;

    const currentPrompt = promptText.trim();
    const interactionId = `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    setIsGenerating(true);
    setErrorMessage(null);
    setSaveError(null);

    // Form initial interaction data
    const initialUserMessage: InteractionMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      text: currentPrompt,
      timestamp: nowIso,
    };

    // Auto-generate title from first sentence
    const autoTitle = currentPrompt.length > 50 
      ? currentPrompt.slice(0, 47).replace(/\n/g, ' ') + '...'
      : currentPrompt.replace(/\n/g, ' ');

    try {
      // 1. Call server-side Gemini API proxy
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          mode: selectedMode,
          history: [],
          customPrompt: customFocus.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gemini API call failed.');
      }

      const modelMessage: InteractionMessage = {
        id: `msg_m_${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed || 'gemini-3.6-flash',
      };

      const newInteraction: JournalInteraction = {
        id: interactionId,
        userId: user.uid,
        title: autoTitle || 'Reflection Entry',
        mode: selectedMode,
        initialPrompt: currentPrompt,
        latestResponse: data.text,
        messages: [initialUserMessage, modelMessage],
        tags: [selectedMode],
        createdAt: nowIso,
        updatedAt: nowIso,
        wordCount: currentPrompt.split(/\s+/).length + data.text.split(/\s+/).length,
        modelUsed: data.modelUsed || 'gemini-3.6-flash',
        isFavorite: false,
      };

      // 2. Guaranteed Transaction Verification (Input-to-Save Completeness)
      try {
        setIsSaving(true);
        await saveUserInteraction(user.uid, newInteraction);
        setActiveInteraction(newInteraction);
        setPromptText(''); // Clear only after confirmed successful write
        setCustomFocus('');
      } catch (dbErr: any) {
        console.error('Firestore save failed:', dbErr);
        setSaveError({
          interaction: newInteraction,
          error: dbErr.message || 'Failed to persist entry to Cloud Firestore.',
        });
        setActiveInteraction(newInteraction); // Keep in memory so user can review/retry
      } finally {
        setIsSaving(false);
      }
    } catch (err: any) {
      console.error('Generation failed:', err);
      setErrorMessage(err.message || 'An error occurred while generating your reflection.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Multi-turn Follow-up conversation
  const handleSendFollowUp = async (followUpText: string) => {
    if (!activeInteraction || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setSaveError(null);

    const nowIso = new Date().toISOString();
    const newUserMsg: InteractionMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      text: followUpText,
      timestamp: nowIso,
    };

    // Prepare previous history
    const historyPayload = activeInteraction.messages.map((m) => ({
      role: m.role,
      text: m.text,
    }));

    try {
      const response = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: followUpText,
          mode: activeInteraction.mode,
          history: historyPayload,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate follow-up reflection.');
      }

      const newModelMsg: InteractionMessage = {
        id: `msg_m_${Date.now()}`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed || 'gemini-3.6-flash',
      };

      const updatedInteraction: JournalInteraction = {
        ...activeInteraction,
        latestResponse: data.text,
        messages: [...activeInteraction.messages, newUserMsg, newModelMsg],
        updatedAt: new Date().toISOString(),
        modelUsed: data.modelUsed || activeInteraction.modelUsed,
      };

      // Save updated interaction
      try {
        await saveUserInteraction(user.uid, updatedInteraction);
        setActiveInteraction(updatedInteraction);
      } catch (dbErr: any) {
        setSaveError({
          interaction: updatedInteraction,
          error: 'Follow-up saved in memory, but Firestore synchronization failed.',
        });
        setActiveInteraction(updatedInteraction);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Follow-up reflection failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Retry Save Handler
  const handleRetrySave = async () => {
    if (!saveError) return;
    try {
      setIsSaving(true);
      await saveUserInteraction(user.uid, saveError.interaction);
      setSaveError(null);
    } catch (err: any) {
      setSaveError({
        interaction: saveError.interaction,
        error: `Retry failed: ${err.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (id: string, current: boolean) => {
    const item = interactions.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, isFavorite: !current };
    await saveUserInteraction(user.uid, updated);
  };

  // Add Tag
  const handleAddTag = async (id: string, tag: string) => {
    const item = interactions.find((i) => i.id === id);
    if (!item) return;
    if (item.tags.includes(tag)) return;
    const updated = { ...item, tags: [...item.tags, tag] };
    await saveUserInteraction(user.uid, updated);
  };

  // Remove Tag
  const handleRemoveTag = async (id: string, tagToRemove: string) => {
    const item = interactions.find((i) => i.id === id);
    if (!item) return;
    const updated = { ...item, tags: item.tags.filter((t) => t !== tagToRemove) };
    await saveUserInteraction(user.uid, updated);
  };

  // Delete interaction
  const handleDeleteInteraction = async (id: string) => {
    await deleteUserInteraction(user.uid, id);
    if (activeInteraction?.id === id) {
      setActiveInteraction(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Security & Isolation Status Banner */}
      <SecurityBanner user={user} />

      {/* Error & Warning Alerts */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="font-semibold">Generation Notice</p>
            <p>{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Persistence Failure Banner with Retry Action */}
      {saveError && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div>
              <p className="font-semibold">Firestore Synchronization Pending</p>
              <p className="text-xs text-amber-800">{saveError.error}</p>
            </div>
          </div>
          <button
            id="retry-save-btn"
            onClick={handleRetrySave}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'Retrying...' : 'Retry Save'}</span>
          </button>
        </div>
      )}

      {/* Main View Router */}
      {activeView === 'history' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <span>Past Journal Entries & Reflections ({interactions.length})</span>
            </h2>

            <button
              id="new-reflection-from-history"
              onClick={handleStartNewEntry}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Compose New</span>
            </button>
          </div>

          <HistoryList
            interactions={interactions}
            activeInteractionId={activeInteraction?.id || null}
            onSelectInteraction={(item) => {
              setActiveInteraction(item);
              onToggleView('editor');
            }}
            onDeleteInteraction={handleDeleteInteraction}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      ) : (
        /* Composer & Active Dialogue View */
        <div className="space-y-6">
          
          {/* If there is an active interaction loaded, show conversation card */}
          {activeInteraction ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  id="back-to-new-entry-btn"
                  onClick={handleStartNewEntry}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 shadow-xs"
                >
                  <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Start New Reflection</span>
                </button>

                <span className="text-xs text-gray-400">
                  Active Multi-turn Conversation
                </span>
              </div>

              <ReflectionCard
                interaction={activeInteraction}
                onSendFollowUp={handleSendFollowUp}
                onToggleFavorite={handleToggleFavorite}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
                isGenerating={isGenerating}
              />
            </div>
          ) : (
            /* New Reflection Composer */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 sm:p-7 space-y-6">
              
              {/* Header */}
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span>New Reflection & Journal Entry</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Select your synthesis objective and write your thoughts. Gemini 3.6 Flash will reflect, structure, and provide clarity.
                </p>
              </div>

              {/* Mode Selector */}
              <ModeSelector
                currentMode={selectedMode}
                onSelectMode={(mode) => setSelectedMode(mode)}
              />

              {/* Input Form */}
              <form onSubmit={handleGenerateReflection} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Your Thoughts or Notes
                    </label>
                    <span className="text-[11px] text-gray-400">
                      {promptText.length} / 20,000 characters
                    </span>
                  </div>

                  <textarea
                    id="journal-input-textarea"
                    rows={6}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    disabled={isGenerating}
                    placeholder={activeModeConfig.promptPlaceholder}
                    className="w-full p-4 rounded-xl bg-gray-50/70 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all resize-y disabled:opacity-60 leading-relaxed"
                  />
                </div>

                {/* Optional Custom Instructions / Advanced Options */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{showAdvanced ? 'Hide Custom Focus' : 'Add Custom Focus Area (Optional)'}</span>
                  </button>

                  {showAdvanced && (
                    <div className="mt-2.5 p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                      <label className="text-xs font-medium text-gray-700 block">
                        Specific Focus or Questions for Gemini
                      </label>
                      <input
                        type="text"
                        value={customFocus}
                        onChange={(e) => setCustomFocus(e.target.value)}
                        placeholder="e.g. Focus on pragmatic time management, or offer Stoic philosophy perspectives..."
                        className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-gray-200 text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Auto-saved to Cloud Firestore</span>
                  </div>

                  <button
                    id="generate-reflection-btn"
                    type="submit"
                    disabled={!promptText.trim() || isGenerating}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin" />
                        <span>Reflecting with Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-200" />
                        <span>Reflect with Gemini</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
