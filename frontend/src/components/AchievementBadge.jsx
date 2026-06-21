import React from 'react';
import { Award, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const AchievementBadge = ({ achievement }) => {
  const isUnlocked = achievement.unlocked;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 14 }}
      whileHover={{ scale: isUnlocked ? 1.03 : 1, y: isUnlocked ? -2 : 0 }}
      className={`glass p-3 sm:p-4 rounded-2xl sm:rounded-3xl flex items-start gap-3 transition-all min-w-0 ${
        isUnlocked 
          ? 'border border-brand-indigo/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] hover:border-brand-indigo/50' 
          : 'opacity-50 grayscale border border-white/5'
      }`}
    >
      <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner ${
        isUnlocked 
          ? 'bg-gradient-to-tr from-brand-indigo to-brand-violet shadow-brand-indigo/20' 
          : 'bg-white/5 border border-white/5'
      }`}>
        {isUnlocked ? (
          <Award className="text-white w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Lock className="text-slate-500 w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-white font-bold text-xs sm:text-sm leading-tight">{achievement.name}</h4>
        <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5 leading-relaxed">{achievement.description}</p>
        {isUnlocked && (
          <p className="text-brand-cyan text-[9px] sm:text-[10px] mt-1 font-bold uppercase tracking-wider">
            ✓ Unlocked
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default AchievementBadge;
