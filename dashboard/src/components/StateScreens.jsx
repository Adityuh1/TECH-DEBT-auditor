import React from 'react';
import { RotateCw, AlertTriangle } from 'lucide-react';

/**
 * LOADING SCREEN COMPONENT
 * Renders a clean loading spinner with light/dark contrast transitions.
 */
export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-650 dark:text-zinc-400 transition-colors duration-200">
      <RotateCw className="animate-spin text-indigo-600 dark:text-indigo-400 mb-4" size={40} />
      <p className="font-mono text-xs tracking-widest font-bold uppercase text-indigo-600 dark:text-indigo-400">
        LOADING FINDINGS DATABASE...
      </p>
    </div>
  );
}

/**
 * ERROR SCREEN COMPONENT
 * Renders a professional, readable error state with high contrast in both themes.
 */
export function ErrorScreen({ error }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 transition-colors duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl max-w-md text-center shadow-xl">
        <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
        
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          Findings Cache Missing
        </h2>
        
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
          The dashboard reads pre-built results from <code>findings.json</code>. 
          We need to run the automated CLI audit script to compile this cache database.
        </p>

        <div className="p-3 bg-zinc-100 dark:bg-zinc-950 rounded-xl text-left font-mono text-xs text-red-500 dark:text-red-400 border border-zinc-200 dark:border-zinc-850">
          npm run audit
        </div>
      </div>
    </div>
  );
}
