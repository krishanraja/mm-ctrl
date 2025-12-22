import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authMachine } from '@/lib/authMachine';
import { getPersistedAssessmentId } from '@/utils/assessmentPersistence';
import { Bug, ChevronDown, ChevronUp, Copy, Check, X } from 'lucide-react';

/**
 * Auth Debug Panel
 * 
 * Development-only panel that shows current auth state, session info, and debug actions.
 * Positioned in bottom-right corner, collapsible.
 * 
 * Shows:
 * - Current auth state
 * - User ID
 * - Email
 * - Is anonymous
 * - Has session
 * - Assessment ID (from localStorage)
 * - Route guard decisions
 */

const isDev = import.meta.env.DEV;

interface DebugInfo {
  state: string;
  userId: string | null;
  email: string | null;
  isAnonymous: boolean;
  hasSession: boolean;
  assessmentId: string | null;
  lastStateChange: string;
}

export const AuthDebugPanel: React.FC = () => {
  const { state, userId, email, isAnonymous, hasSession } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  // #region agent log
  React.useEffect(() => {
    fetch('http://127.0.0.1:7248/ingest/509738c9-126a-4942-ae64-8468ded388e5',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthDebugPanel.tsx:mount',message:'AuthDebugPanel mounted',data:{isDev,state,userId,hasSession},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
  }, []);
  // #endregion

  // Only render in development
  if (!isDev) return null;

  useEffect(() => {
    const updateDebugInfo = () => {
      const { assessmentId } = getPersistedAssessmentId();
      const context = authMachine.getContext();
      
      setDebugInfo({
        state,
        userId,
        email,
        isAnonymous,
        hasSession,
        assessmentId,
        lastStateChange: context.lastStateChange.toLocaleTimeString(),
      });
    };

    updateDebugInfo();
    
    // Update periodically
    const interval = setInterval(updateDebugInfo, 2000);
    return () => clearInterval(interval);
  }, [state, userId, email, isAnonymous, hasSession]);

  const copyToClipboard = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const getStateColor = (state: string): string => {
    switch (state) {
      case 'authenticated': return 'bg-emerald-500';
      case 'anonymous_session': return 'bg-amber-500';
      case 'anonymous': return 'bg-slate-500';
      case 'loading': return 'bg-blue-500';
      case 'session_expired': return 'bg-red-500';
      case 'signed_out': return 'bg-slate-400';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg
          bg-slate-900 text-white hover:bg-slate-800 transition-colors
          ${isExpanded ? 'rounded-b-none' : ''}
        `}
      >
        <Bug className="h-4 w-4" />
        <span>Auth</span>
        <span className={`w-2 h-2 rounded-full ${getStateColor(state)}`} />
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronUp className="h-3 w-3" />
        )}
      </button>

      {/* Expanded panel */}
      {isExpanded && debugInfo && (
        <div className="bg-slate-900 text-white rounded-lg rounded-tr-none shadow-lg p-4 min-w-[280px] max-w-[350px]">
          <div className="space-y-2">
            {/* State */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">State:</span>
              <span className={`px-2 py-0.5 rounded ${getStateColor(debugInfo.state)} text-white`}>
                {debugInfo.state}
              </span>
            </div>

            {/* User ID */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">User ID:</span>
              {debugInfo.userId ? (
                <button
                  onClick={() => copyToClipboard('userId', debugInfo.userId!)}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 truncate max-w-[160px]"
                >
                  <span className="truncate">{debugInfo.userId.slice(0, 8)}...</span>
                  {copied === 'userId' ? (
                    <Check className="h-3 w-3 shrink-0" />
                  ) : (
                    <Copy className="h-3 w-3 shrink-0" />
                  )}
                </button>
              ) : (
                <span className="text-slate-500">null</span>
              )}
            </div>

            {/* Email */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Email:</span>
              <span className="text-slate-300 truncate max-w-[160px]">
                {debugInfo.email || 'null'}
              </span>
            </div>

            {/* Flags */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Is Anonymous:</span>
              <span className={debugInfo.isAnonymous ? 'text-amber-400' : 'text-slate-500'}>
                {debugInfo.isAnonymous ? 'true' : 'false'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Has Session:</span>
              <span className={debugInfo.hasSession ? 'text-emerald-400' : 'text-red-400'}>
                {debugInfo.hasSession ? 'true' : 'false'}
              </span>
            </div>

            {/* Assessment ID */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Assessment ID:</span>
              {debugInfo.assessmentId ? (
                <button
                  onClick={() => copyToClipboard('assessmentId', debugInfo.assessmentId!)}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 truncate max-w-[120px]"
                >
                  <span className="truncate">{debugInfo.assessmentId.slice(0, 8)}...</span>
                  {copied === 'assessmentId' ? (
                    <Check className="h-3 w-3 shrink-0" />
                  ) : (
                    <Copy className="h-3 w-3 shrink-0" />
                  )}
                </button>
              ) : (
                <span className="text-slate-500">null</span>
              )}
            </div>

            {/* Last state change */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Last Change:</span>
              <span className="text-slate-500">{debugInfo.lastStateChange}</span>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-700 flex gap-2">
              <button
                onClick={async () => {
                  const { signOut } = await import('@/lib/authMachine').then(m => m.authMachine);
                  signOut();
                }}
                className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-center"
              >
                Sign Out
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-center"
              >
                Clear & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebugPanel;

