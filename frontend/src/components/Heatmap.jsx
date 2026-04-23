import React from 'react';

const Heatmap = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Render a basic grid representing the last 4 months (approx 120 days = 17 weeks)
  const recentData = data.slice(-119); // 17 weeks * 7 days
  
  // Group into weeks
  const weeks = [];
  for (let i = 0; i < recentData.length; i += 7) {
    weeks.push(recentData.slice(i, i + 7));
  }

  const getIntensityColor = (count) => {
    if (count === 0) return 'bg-white/5 border border-white/5';
    if (count < 2) return 'bg-brand-indigo/30 border border-brand-indigo/20';
    if (count < 4) return 'bg-brand-indigo/60 border border-brand-indigo/40 hover:shadow-[0_0_10px_rgba(99,102,241,0.5)]';
    return 'bg-brand-violet border border-brand-violet/50 hover:shadow-[0_0_15px_rgba(139,92,246,0.8)]';
  };

  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-2">
      <div className="flex gap-1.5 min-w-max items-end">
        {weeks.map((week, wIndex) => (
          <div key={`week-${wIndex}`} className="flex flex-col gap-1.5">
            {week.map((day, dIndex) => (
              <div 
                key={`day-${wIndex}-${dIndex}`}
                className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 ${getIntensityColor(day.count)} cursor-pointer`}
                title={`${day.date}: ${day.count} applications`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-end items-center gap-2 mt-4 text-xs text-slate-500">
        Less
        <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/5"></div>
        <div className="w-3 h-3 rounded-sm bg-brand-indigo/30"></div>
        <div className="w-3 h-3 rounded-sm bg-brand-indigo/60"></div>
        <div className="w-3 h-3 rounded-sm bg-brand-violet"></div>
        More
      </div>
    </div>
  );
};

export default Heatmap;
