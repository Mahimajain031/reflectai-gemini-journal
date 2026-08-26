import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, formatUserProfile } from './firebase';
import { UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { AuthLanding } from './components/AuthLanding';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'editor' | 'history'>('editor');
  const [entriesCount, setEntriesCount] = useState(0);

  // Monitor Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(formatUserProfile(firebaseUser));
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        setUser(formatUserProfile(loggedUser));
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        // User closed or dismissed the popup; no error banner needed
        return;
      }
      console.error('Sign-in error:', err);
      setAuthError(err.message || 'Failed to sign in with Google. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setActiveView('editor');
    } catch (err: any) {
      console.error('Sign-out error:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-gray-900 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs text-gray-500 font-mono">Initializing secure session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onNewEntry={() => setActiveView('editor')}
        entriesCount={entriesCount}
        activeView={activeView}
        onToggleView={(view) => setActiveView(view)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {user ? (
          <Dashboard
            user={user}
            activeView={activeView}
            onToggleView={(view) => setActiveView(view)}
            onUpdateEntriesCount={(count) => setEntriesCount(count)}
          />
        ) : (
          <AuthLanding
            onSignIn={handleSignIn}
            isLoading={authLoading}
            errorMessage={authError}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} ReflectAI. Private & isolated user reflections.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              Gemini 3.6 Flash
            </span>
            <span>•</span>
            <span>Cloud Firestore</span>
            <span>•</span>
            <span>Firebase Auth</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
