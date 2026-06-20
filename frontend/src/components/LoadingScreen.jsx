import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

const STATUS_MESSAGES = [
  "Securing communication lines...",
  "Loading matrix interface...",
  "Verifying encryption keys...",
  "Synchronizing data streams...",
  "Powering up TrackerPro..."
];

const LoadingScreen = () => {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-indigo/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-violet/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Main Container */}
      <div className="flex flex-col items-center z-10 space-y-8">
        
        {/* Advanced Logo Animation with Ripple Waves */}
        <div className="relative flex items-center justify-center w-36 h-36">
          {/* Ripple Wave 1 */}
          <motion.div
            className="absolute inset-0 rounded-[2.5rem] border border-brand-indigo/30 bg-brand-indigo/5"
            initial={{ opacity: 0.6, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />

          {/* Ripple Wave 2 */}
          <motion.div
            className="absolute inset-0 rounded-[2.5rem] border border-brand-violet/20 bg-brand-violet/5"
            initial={{ opacity: 0.6, scale: 0.8 }}
            animate={{ opacity: 0, scale: 2 }}
            transition={{ duration: 2, delay: 0.75, repeat: Infinity, ease: "easeOut" }}
          />

          {/* Ripple Wave 3 */}
          <motion.div
            className="absolute inset-0 rounded-[2.5rem] border border-white/5"
            initial={{ opacity: 0.3, scale: 0.8 }}
            animate={{ opacity: 0, scale: 2.4 }}
            transition={{ duration: 2, delay: 1.5, repeat: Infinity, ease: "easeOut" }}
          />

          {/* Glowing Aura Outer Ring */}
          <motion.div 
            className="absolute w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-brand-indigo to-brand-violet opacity-30 blur-md"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />

          {/* Main Core Logo Box */}
          <motion.div
            className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-brand-indigo to-brand-violet flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)] border border-white/10 relative z-20"
            initial={{ scale: 0.9, rotate: -15 }}
            animate={{ 
              scale: [0.9, 1.05, 0.9],
              rotate: [-15, 15, -15]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            <Target className="text-white w-10 h-10 filter drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)]" />
          </motion.div>
        </div>

        {/* Branding text with shine sweep */}
        <div className="text-center space-y-2">
          <div className="relative overflow-hidden inline-block px-4 py-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-widest text-white">
              TRACKER<span className="text-brand-indigo">PRO</span>
            </h1>
            <motion.div
              className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
              animate={{ left: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Fading cycling status message */}
          <div className="h-6 flex items-center justify-center">
            <motion.p
              key={statusIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono"
            >
              {STATUS_MESSAGES[statusIdx]}
            </motion.p>
          </div>
        </div>

        {/* Premium glowing slim progress bar */}
        <div className="w-48 h-[3px] bg-white/5 rounded-full overflow-hidden relative">
          <motion.div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-brand-indigo to-brand-violet rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
