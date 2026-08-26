import React from 'react';
import { ReflectionMode, ModeConfig } from '../types';
import { Sparkles, FileText, Lightbulb, HeartHandshake, HelpCircle } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: ReflectionMode;
  onSelectMode: (mode: ReflectionMode) => void;
}

export const MODES: ModeConfig[] = [
  {
    id: 'reflection',
    label: 'Daily Reflection',
    description: 'Mindful synthesis, philosophical angles & exploratory questions.',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconName: 'Sparkles',
    promptPlaceholder: 'Write about your day, a moment that stood out, or a personal challenge you faced today...',
  },
  {
    id: 'summary',
    label: 'Summary & Takeaways',
    description: 'Distills notes, meetings, or long thoughts into high-impact action items.',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconName: 'FileText',
    promptPlaceholder: 'Paste rough notes, journal entries, or thoughts to extract structured summaries and action items...',
  },
  {
    id: 'brainstorm',
    label: 'Brainstorm & Action',
    description: 'Generates creative perspectives, alternatives, and 3-phase action plans.',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    iconName: 'Lightbulb',
    promptPlaceholder: 'Describe an ambitious project, creative idea, or roadblock you want to brainstorm solutions for...',
  },
  {
    id: 'clarity',
    label: 'Emotional Clarity',
    description: 'Empathetic validation, cognitive reframing & grounding techniques.',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    iconName: 'HeartHandshake',
    promptPlaceholder: 'Share feelings of anxiety, indecision, or stress for cognitive reframing and grounding perspectives...',
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
        Select Reflection Mode
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {MODES.map((mode) => {
          const isSelected = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              id={`mode-select-${mode.id}`}
              type="button"
              onClick={() => onSelectMode(mode.id)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/80 border-indigo-600 ring-1 ring-indigo-600 text-gray-900 shadow-xs'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-semibold text-xs ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                  {mode.label}
                </span>
                {isSelected ? (
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-gray-200" />
                )}
              </div>
              <p
                className={`text-[11px] leading-relaxed line-clamp-2 ${
                  isSelected ? 'text-indigo-700' : 'text-gray-500'
                }`}
              >
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
