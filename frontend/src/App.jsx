import React from 'react';
import { CreditCard, Layers, Zap, CheckCircle2 } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Odoo x Flux</span>
          </div>
          <span className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-semibold">
            v1.0 Live
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
          Subscription Engine for Odoo & Flux
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
          Recurring billing, invoice automation, and multi-tier subscription platform built with React & FastAPI.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl">
            <CreditCard className="h-8 w-8 text-indigo-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Automated Billing</h3>
            <p className="text-slate-400 text-sm">Recurring payment triggers and invoice sync.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl">
            <Layers className="h-8 w-8 text-indigo-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Tier Management</h3>
            <p className="text-slate-400 text-sm">Custom discount codes and tax overrides.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-xl">
            <CheckCircle2 className="h-8 w-8 text-indigo-400 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">FastAPI Sync</h3>
            <p className="text-slate-400 text-sm">Seamless connection to PostgreSQL database.</p>
          </div>
        </div>
      </main>
    </div>
  );
}