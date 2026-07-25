import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { SidebarNav } from './SidebarNav';
import { Bot, Sparkles, Loader2 } from 'lucide-react';
import { AskSahasraCopilot } from './AskSahasraCopilot';
import { DataProvenanceBadge } from './DataProvenanceBadge';
import { CommandPalette } from './CommandPalette';

export const Layout: React.FC = () => {
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 relative">
      {/* Fixed Top Bar */}
      <TopBar />

      {/* Main Content Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <SidebarNav />

        {/* Dynamic Route Content Shell */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950">
          <div className="max-w-7xl mx-auto space-y-6">
            <Suspense fallback={
              <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                <span className="text-xs font-mono uppercase tracking-wider">Loading module…</span>
              </div>
            }>
              <Outlet />
            </Suspense>
            <DataProvenanceBadge />
          </div>
        </main>
      </div>

      {/* Persistent Floating Trigger Button for Ask SAHASRA Copilot */}
      <button
        onClick={() => setCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-[3000] px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-navy-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-2xl flex items-center gap-2 transition-transform hover:scale-105 border-2 border-amber-400"
      >
        <Bot className="w-5 h-5 text-navy-950" />
        <span>Ask SAHASRA Copilot</span>
        <Sparkles className="w-4 h-4 text-navy-950 animate-pulse" />
      </button>

      {/* Ask SAHASRA Copilot Persistent Side Panel */}
      <AskSahasraCopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
      />

      {/* Global Command Palette (⌘K / Ctrl+K) */}
      <CommandPalette />
    </div>
  );
};
