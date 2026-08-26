import React from 'react';
import { UserProfile } from '../types';
import { 
  Sparkles, 
  LogOut, 
  ShieldCheck, 
  BookOpen, 
  PlusCircle, 
  Database,
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  entriesCount: number;
  activeView: 'editor' | 'history';
  onToggleView: (view: 'editor' | 'history') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewEntry,
  entriesCount,
  activeView,
  onToggleView,
}) => {
  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 tracking-tight text-base sm:text-lg">
                ReflectAI
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block">
              Private AI Journal & Reflections with Isolated Firestore
            </p>
          </div>
        </div>

        {/* Center navigation tabs (if logged in) */}
        {user && (
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200/80">
            <button
              id="nav-editor-tab"
              onClick={() => onToggleView('editor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === 'editor'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Compose</span>
            </button>

            <button
              id="nav-history-tab"
              onClick={() => onToggleView('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeView === 'history'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Entries ({entriesCount})</span>
            </button>
          </div>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* User badge */}
              <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-gray-50 border border-gray-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="text-xs font-medium text-gray-800 max-w-[120px] truncate hidden md:inline">
                  {user.displayName || user.email}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Authenticated & Isolated" />
              </div>

              {/* Sign out button */}
              <button
                id="sign-out-btn"
                onClick={onSignOut}
                title="Sign Out"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-gray-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline font-medium">Secure Firebase Session</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
