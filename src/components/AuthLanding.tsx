import React, { useState } from 'react';
import { 
  Sparkles, 
  Shield, 
  Lock, 
  Database, 
  Cpu, 
  CheckCircle2, 
  ArrowRight,
  BrainCircuit,
  FileText,
  Lightbulb,
  HeartHandshake
} from 'lucide-react';

interface AuthLandingProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  const [signingIn, setSigningIn] = useState(false);

  const handleSignInClick = async () => {
    try {
      setSigningIn(true);
      await onSignIn();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto space-y-12">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Multi-turn Gemini Reflections & Firestore Isolation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
            Your Private Space for Thoughts, Synthesis & Clarity
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Express your daily thoughts, dilemmas, or ideas. Gemini 3.6 Flash provides deep structured synthesis, actionable next steps, and mindful perspectives — securely stored in your personal, isolated Firestore document vault.
          </p>

          {/* Error Banner if any */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl text-left max-w-md mx-auto">
              <p className="font-semibold">Authentication Notice</p>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Authentication Call to Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="google-signin-btn"
              onClick={handleSignInClick}
              disabled={isLoading || signingIn}
              className="w-full sm:w-auto px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-3 shadow-xs hover:shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading || signingIn ? (
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continue with Google Sign-In</span>
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Federated Google Authentication. No passwords stored or handled directly.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Gemini 3.6 Flash AI</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Fast, high-context generation with automated fallback ladder and deep structured prompts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Owner-Bound Firestore</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every entry is mapped strictly to <code className="text-[11px] bg-gray-100 px-1 py-0.5 rounded text-gray-800">/users/uid/interactions</code> with zero cross-user access.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Multi-Turn Reflections</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Continue ongoing dialogues, brainstorm follow-ups, and dig deeper into complex problems.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Secret & Token Hygiene</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Backend proxies ensure API keys and Firebase credentials are never leaked to client browsers.
            </p>
          </div>
        </div>

        {/* 4 Reflection Modes Preview */}
        <div className="p-6 rounded-2xl bg-gray-100/70 border border-gray-200 space-y-4">
          <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Tailored Reflection Modalities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-xs flex items-start gap-3">
              <FileText className="w-4 h-4 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-medium text-xs text-gray-900">Daily Reflection</p>
                <p className="text-[11px] text-gray-500">Mindful synthesis & philosophical insights.</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-xs flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-xs text-gray-900">Executive Summary</p>
                <p className="text-[11px] text-gray-500">Core motifs, key points & action items.</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-xs flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-xs text-gray-900">Brainstorming</p>
                <p className="text-[11px] text-gray-500">Structured 3-phase plans & creative ideas.</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-gray-200 shadow-xs flex items-start gap-3">
              <HeartHandshake className="w-4 h-4 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-xs text-gray-900">Emotional Clarity</p>
                <p className="text-[11px] text-gray-500">Cognitive reframing & grounding exercises.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
