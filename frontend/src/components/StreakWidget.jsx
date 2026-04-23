import React from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const StreakWidget = ({ streak }) => {
  if (!streak) return null;

  return (
    <div className="glass-card p-6 flex items-center justify-between overflow-hidden relative group">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-500/20 blur-[50px] group-hover:bg-orange-500/30 transition-all duration-700 pointer-events-none"></div>
      
      <div>
        <h4 className="text-slate-400 font-medium text-sm mb-1 uppercase tracking-widest">Consistency</h4>
        <div className="text-white font-bold text-2xl flex items-center gap-2">
          {streak.currentStreak} Day Streak
        </div>
        <p className="text-orange-300 text-sm mt-1 font-medium">{streak.statusMessage}</p>
      </div>

      <motion.div 
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)]"
      >
        <Flame className="text-white w-8 h-8" />
      </motion.div>
    </div>
  );
};

export default StreakWidget;
