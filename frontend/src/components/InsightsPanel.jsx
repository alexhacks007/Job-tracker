import React from 'react';
import { Sparkles, TrendingUp, Target, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

const InsightsPanel = ({ insights }) => {
  if (!insights) return null;

  return (
    <div className="glass-card p-6 h-full flex flex-col gap-6">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <div className="p-2 bg-brand-violet/20 rounded-xl">
          <Sparkles className="text-brand-violet w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-white">Smart Insights</h3>
      </div>

      {insights.adminNudge && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2 opacity-20">
             <Sparkles className="text-emerald-500 w-8 h-8" />
          </div>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Incoming Sentinel Nudge</p>
          <p className="text-white text-sm font-bold leading-relaxed">{insights.adminNudge}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div className="glass p-4 rounded-2xl flex items-start gap-4">
          <TrendingUp className="text-emerald-400 w-5 h-5 mt-1" />
          <div>
            <p className="text-sm text-slate-400">Momentum</p>
            <p className="text-white font-medium">{insights.weeklyChange.message}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl flex items-start gap-4">
          <Target className="text-brand-indigo w-5 h-5 mt-1" />
          <div>
            <p className="text-sm text-slate-400">Monthly Goal</p>
            <p className="text-white font-medium">{insights.goalRemaining.message}</p>
            <div className="w-full bg-surface-900 rounded-full h-1.5 mt-3">
              <div 
                className="bg-brand-indigo h-1.5 rounded-full" 
                style={{ width: `${(insights.goalRemaining.current / insights.goalRemaining.target) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl flex border border-brand-indigo/30 bg-brand-indigo/5 items-start gap-4">
          <Lightbulb className="text-amber-400 w-5 h-5 mt-1 align-baseline shrink-0" />
          <div>
            <p className="text-sm text-amber-200/70 mb-1">AI Career Tip</p>
            <p className="text-white font-medium text-sm leading-relaxed">{insights.tips[0]}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;
