import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 text-center glass-card relative overflow-hidden group"
    >
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-indigo/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-brand-indigo/20 transition-all duration-700"></div>
      
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 relative z-10 shadow-[0_0_30px_rgba(99,102,241,0.15)] group-hover:shadow-[0_0_50px_rgba(99,102,241,0.3)] transition-all">
        {Icon ? <Icon className="w-10 h-10 text-brand-violet" /> : <div className="w-10 h-10 bg-brand-violet/50 rounded-full"></div>}
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-2 relative z-10">{title}</h3>
      <p className="text-slate-400 max-w-md mb-8 relative z-10">
        {description}
      </p>
      
      {actionText && onAction && (
        <button 
          onClick={onAction}
          className="btn-primary relative z-10"
        >
          <Plus size={16} />
          {actionText}
        </button>
      )}
    </motion.div>
  );
};

export default EmptyState;
