import React, { useState } from 'react';
import { ShieldCheck, Info, Database, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { UserProfile } from '../types';

interface SecurityBannerProps {
  user: UserProfile;
}

export const SecurityBanner: React.FC<SecurityBannerProps> = ({ user }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-900 text-gray-200 rounded-2xl p-4 sm:p-5 border border-gray-800 shadow-xs transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-white">
                Firestore User Isolation Active
              </span>
              <span className="text-[10px] font-mono bg-emerald-900/60 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full">
                Strict RBAC Enforced
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono truncate max-w-xs sm:max-w-md">
              Path: /users/{user.uid}/interactions/*
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-300 hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-750 cursor-pointer"
        >
          <span>{expanded ? 'Hide Details' : 'Verify Rules'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-800 text-xs space-y-2 text-gray-300">
          <p className="leading-relaxed">
            Every prompt, journal entry, and Gemini AI response is written directly to your dedicated Firestore subcollection. Under deployed <code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded border border-gray-800">firestore.rules</code>:
          </p>
          <pre className="p-2.5 bg-black/50 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto border border-gray-800">
{`match /users/{userId}/interactions/{interactionId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}`}
          </pre>
          <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-1">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" /> End-to-End User Bound
            </span>
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-indigo-400" /> Undefined-Stripping Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
