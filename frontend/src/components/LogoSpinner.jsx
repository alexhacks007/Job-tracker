import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

const LogoSpinner = ({ size = 'md', message = 'Synchronizing...' }) => {
  const sizeConfig = {
    sm: { box: 'w-10 h-10 rounded-xl', icon: 16, text: 'text-[9px]' },
    md: { box: 'w-14 h-14 rounded-2xl', icon: 24, text: 'text-[10px]' },
    lg: { box: 'w-20 h-20 rounded-[2rem]', icon: 32, text: 'text-xs' }
  }[size] || { box: 'w-14 h-14 rounded-2xl', icon: 24, text: 'text-[10px]' };

  return (
    <div className="flex flex-col items-center justify-center space-y-3 p-8">
      <div className="relative flex items-center justify-center">
        {/* Ripple ring */}
        <motion.div
          className="absolute inset-0 border border-brand-indigo/30 bg-brand-indigo/5 rounded-full"
          initial={{ opacity: 0.6, scale: 0.8 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
        
        {/* Core logo box */}
        <motion.div
          className={`${sizeConfig.box} bg-gradient-to-tr from-brand-indigo to-brand-violet flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)] border border-white/5 relative z-10`}
          animate={{ 
            scale: [0.95, 1.05, 0.95],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 2.5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Target size={sizeConfig.icon} className="text-white" />
        </motion.div>
      </div>

      {message && (
        <span className={`${sizeConfig.text} font-black text-slate-500 uppercase tracking-widest font-mono animate-pulse`}>
          {message}
        </span>
      )}
    </div>
  );
};

export default LogoSpinner;
