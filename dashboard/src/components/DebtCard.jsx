import React from 'react';
import { TrendingUp, User, Clock, Code } from 'lucide-react';

// Maps our AI & fallback categories to high-end Tailwind badge colors dynamically
const categoryStyles = {
  security: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
  performance: 'bg-yellow-500/10 text-yellow-750 dark:text-yellow-400 border border-yellow-500/20',
  maintenance: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
  feature: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20',
  fixme: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
  hack: 'bg-yellow-500/10 text-yellow-750 dark:text-yellow-400 border border-yellow-500/20',
  todo: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
};

/**
 * DEBTCARD PRESENTATIONAL COMPONENT
 * Renders metadata, age, and code coordinates with custom animations and high-contrast texts.
 */
export function DebtCard({ item }) {
  const isHighRisk = item.riskScore >= 7;
  
  // Calculate how long this debt item has existed
  const createdDate = new Date(item.createdAt);
  const today = new Date();
  const diffTime = Math.abs(today - createdDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Clean up the category key for lookup (e.g. "Security" -> "security")
  const catKey = (item.category || 'todo').toLowerCase();
  const badgeStyle = categoryStyles[catKey] || 'bg-zinc-150 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-350 dark:border-zinc-700/50';

  return (
    <div className={`flex flex-col justify-between bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 p-6 rounded-xl min-h-[270px] box-border transition-all duration-300 ${
      isHighRisk 
        ? 'border-t-4 border-t-red-500 hover:border-red-500/30 hover:-translate-y-1 hover:shadow-lg' 
        : 'border-t-4 border-t-indigo-500 dark:border-t-indigo-400 hover:border-indigo-500/30 hover:-translate-y-1 hover:shadow-lg'
    }`}>
      
      {/* Upper Content Segment */}
      <div className="mb-6">
        
        {/* Card Header: Category & Score */}
        <div className="flex justify-between items-center mb-3">
          <span className={`text-[15px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${badgeStyle}`}>
            {item.category}
          </span>
          <span className={`text-xs font-bold flex items-center gap-1 ${
            isHighRisk ? 'text-red-650 dark:text-red-400' : 'text-indigo-650 dark:text-indigo-400'
          }`}>
            <TrendingUp size={14} /> Score: {item.riskScore}
          </span>
        </div>
        
        {/* Comment and AI explanation */}
        <p className="text-zinc-900 dark:text-zinc-100 font-bold mb-2 text-left italic leading-relaxed text-sm">
          "{item.comment}"
        </p>
        <p className="text-xs text-zinc-600 dark:text-zinc-450 text-left leading-relaxed">
          {item.explanation}
        </p>
      </div>

      {/* Bottom Metadata Panel */}
      <div className="border-t border-zinc-200/50 dark:border-zinc-800/40 pt-4 mt-auto">
        
        {/* Author & Age block */}
        <div className="flex justify-between text-[11px] text-zinc-500 dark:text-zinc-450 bg-zinc-50 dark:bg-zinc-950/20 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850/30 mb-2">
          <div className="flex items-center gap-1.5">
            <User size={12} className="text-zinc-450 dark:text-zinc-500" />
            <span>Author: <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.author || 'Unknown'}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-yellow-600 dark:text-yellow-500/70" />
            <span className="font-bold text-yellow-600 dark:text-yellow-500/80">{diffDays} days old</span>
          </div>
        </div>

        {/* Technical Code Coordinates */}
        <div className="text-[10px] text-zinc-500 dark:text-zinc-450 font-mono bg-zinc-55 dark:bg-zinc-950/40 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-850/60 flex items-center gap-1.5 truncate">
          <Code size={12} className="text-indigo-600 dark:text-indigo-400/80 shrink-0" />
          <span className="truncate" title={`${item.file} : Line ${item.line}`}>
            {item.file} <span className="text-indigo-650 dark:text-indigo-400/60">: L{item.line}</span>
          </span>
        </div>

      </div>

    </div>
  );
}
