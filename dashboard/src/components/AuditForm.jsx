import React from 'react';

/**
 * AuditForm Component.
 * Renders the input fields for the Git URL and Private Token, along with the action button.
 */
export function AuditForm({ repoUrl, setRepoUrl, gitToken, setGitToken, onAuditSubmit }) {
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onAuditSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="flex-grow w-full text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                    Repository URL
                </label>
                <input 
                    type="text" 
                    placeholder="e.g., https://github.com/username/my-project"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all"
                    required
                />
            </div>
            
            <div className="w-full md:w-85 text-left">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                    Access Token (Private repos)
                </label>
                <input 
                    type="password" 
                    placeholder="GitHub Personal Access Token"
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all"
                />
            </div>
            
            <button 
                type="submit"
                className="w-full md:w-auto px-6 py-2.5 mt-5 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-md"
            >
                Audit Repo
            </button>
        </form>
    );
}
