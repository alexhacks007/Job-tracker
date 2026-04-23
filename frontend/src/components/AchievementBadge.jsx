import React from 'react';
import { Award, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const AchievementBadge = ({ achievement }) => {
  const isUnlocked = achievement.unlocked;

  return (
    <motion.div 
      whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
      className={`glass p-4 rounded-3xl flex items-center gap-4 transition-all ${
        isUnlocked ? 'border-brand-indigo/30 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'opacity-60 grayscale'
      }`}
    >
      <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-inner ${
        isUnlocked ? 'bg-gradient-to-tr from-brand-indigo to-brand-violet' : 'bg-surface-800 border border-white/5'
      }`}>
        {isUnlocked ? (
          <Award className="text-white w-6 h-6" />
        ) : (
          <Lock className="text-slate-500 w-6 h-6" />
        )}
      </div>
      <div>
        <h4 className="text-white font-bold text-sm">{achievement.name}</h4>
        <p className="text-slate-400 text-xs mt-0.5">{achievement.description}</p>
        {isUnlocked && <p className="text-brand-cyan text-[10px] mt-1 font-bold uppercase tracking-wider">Unlocked {achievement.date}</p>}
      </div>
    </motion.div>
  );
};

export default AchievementBadge;
