import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

const AnimatedNumber = ({ value }) => {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};

const StatsCard = ({ title, value, icon: Icon, trend, trendValue, color }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass p-6 rounded-[2rem] relative overflow-hidden group"
    >
      {/* Background Glow */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${color}`} />
      
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        {trend && (
            <div className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                trend === 'up' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
            }`}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}%
            </div>
        )}
      </div>

      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-4xl font-bold text-white tracking-tight">
             <AnimatedNumber value={value} />
          </h3>
          {title === 'Response Rate' && <span className="text-xl font-semibold text-slate-500">%</span>}
        </div>
      </div>

      {/* Progress Line */}
      <div className="mt-6 w-full h-1 bg-white/5 rounded-full overflow-hidden">
         <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '70%' }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`h-full rounded-full ${color}`}
         />
      </div>
    </motion.div>
  );
};

export default StatsCard;
