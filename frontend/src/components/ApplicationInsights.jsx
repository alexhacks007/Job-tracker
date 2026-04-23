import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, 
  XAxis, YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Activity, 
  Target, 
  Layers, 
  ChevronDown,
  Briefcase,
  Clock,
  Layout
} from 'lucide-react';

const COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass p-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
        <p className="text-sm font-bold text-white flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-brand-indigo" />
           {payload[0].value} Applications
        </p>
      </div>
    );
  }
  return null;
};

const ApplicationInsights = ({ stats }) => {
  const [range, setRange] = useState(30);
  const [view, setView] = useState('trend'); // 'trend' or 'distribution'

  // Process data for the selected range
  const { filteredChartData, dailyAvg, peakDayVal, peakDayName, comparisonPercent, weekdayData, statusData } = useMemo(() => {
    if (!stats || !stats.chartData) return {};

    const now = new Date();
    const rangeStart = new Date(now.setDate(now.getDate() - range));
    const prevRangeStart = new Date(new Date(rangeStart).setDate(rangeStart.getDate() - range));

    // Current period
    const currentData = stats.chartData.filter(d => new Date(d.date) >= rangeStart);
    const totalCurrent = currentData.reduce((acc, d) => acc + d.applications, 0);
    
    // Previous period for comparison
    const prevData = stats.chartData.filter(d => {
      const dDate = new Date(d.date);
      return dDate >= prevRangeStart && dDate < rangeStart;
    });
    const totalPrev = prevData.reduce((acc, d) => acc + d.applications, 0);

    const diff = totalPrev === 0 ? 100 : Math.round(((totalCurrent - totalPrev) / totalPrev) * 100);

    // Weekday distribution (Current period)
    const weekdayMap = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
    currentData.forEach(d => {
      const day = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
      weekdayMap[day] += d.applications;
    });
    const formattedWeekdayData = Object.keys(weekdayMap).map(day => ({ name: day, value: weekdayMap[day] }));

    // Status breakdown
    const formattedStatusData = [
      { name: 'Applied', value: stats.applied || 0 },
      { name: 'Interviews', value: stats.interviews || 0 },
      { name: 'Offers', value: stats.offers || 0 },
      { name: 'Rejected', value: stats.rejected || 0 },
    ].filter(s => s.value > 0);

    // Peak and Avg
    const maxVal = Math.max(...currentData.map(d => d.applications), 0);
    const peakDay = currentData.find(d => d.applications === maxVal);
    const avg = currentData.length ? (totalCurrent / currentData.length).toFixed(1) : 0;

    return {
      filteredChartData: currentData.map(d => ({
        ...d,
        name: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      })),
      dailyAvg: avg,
      peakDayVal: maxVal,
      peakDayName: peakDay ? new Date(peakDay.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'N/A',
      comparisonPercent: diff,
      weekdayData: formattedWeekdayData,
      statusData: formattedStatusData
    };
  }, [stats, range]);

  const totalApps = filteredChartData.reduce((acc, d) => acc + d.applications, 0);
  const isLowData = stats.chartData.length < 1; // Only empty if truly zero points
  const showFallback = totalApps === 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-1 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent shadow-2xl relative overflow-hidden"
    >
      <div className="p-8 pb-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
               Application Insights
               <div className="flex bg-white/5 p-1 rounded-xl">
                  <button onClick={() => setView('trend')} title="Trend Chart" className={`p-1.5 rounded-lg transition-all ${view === 'trend' ? 'bg-brand-indigo text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Activity size={14} /></button>
                  <button onClick={() => setView('distribution')} title="Distribution View" className={`p-1.5 rounded-lg transition-all ${view === 'distribution' ? 'bg-brand-indigo text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><Layout size={14} /></button>
               </div>
            </h2>
            <div className="flex items-center gap-2 mt-2">
               {comparisonPercent >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-red-400" />}
               <span className={`text-xs font-bold ${comparisonPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                 {Math.abs(comparisonPercent)}% {comparisonPercent >= 0 ? 'increase' : 'decrease'}
               </span>
               <span className="text-xs text-slate-500 font-medium">vs last {range} days</span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="relative group flex-1 md:flex-none">
                <select 
                  value={range} 
                  onChange={(e) => setRange(Number(e.target.value))}
                  className="w-full md:w-40 appearance-none bg-white/5 border border-white/10 text-white text-xs font-bold py-3 px-5 rounded-2xl outline-none focus:ring-2 focus:ring-brand-indigo/30 transition-all cursor-pointer hover:bg-white/10"
                >
                   <option value={7}>Last 7 days</option>
                   <option value={30}>Last 30 days</option>
                   <option value={90}>Last 90 days</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
             </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
           <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Total</p>
              <h4 className="text-xl font-black text-white">{filteredChartData.reduce((acc, d) => acc + d.applications, 0)} Applications</h4>
           </div>
           <div className="p-5 bg-white/5 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Daily Avg</p>
              <h4 className="text-xl font-black text-white">{dailyAvg} per day</h4>
           </div>
           <div className="p-5 bg-brand-indigo/10 rounded-[2rem] border border-brand-indigo/10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-indigo mb-1">Peak Intensity</p>
              <h4 className="text-xl font-black text-white">{peakDayVal} on {peakDayName}</h4>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 h-full">
          {/* Main Content (Left 70%) */}
          <div className="lg:col-span-7 h-[400px]">
             {isLowData && view === 'trend' ? (
               <div className="h-full flex flex-col items-center justify-center text-center p-8 glass rounded-[2.5rem] border-dashed border-white/10">
                  <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                     <Activity className="w-8 h-8 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Pulsing the market...</h3>
                  <p className="text-sm text-slate-500 max-w-xs mb-8">Apply to more jobs over a few more days to see your intensity trend.</p>
                  
                  {/* Activity Timeline Fallback */}
                  <div className="w-full space-y-3 max-w-sm">
                     <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Recent Activity</h4>
                     <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 no-scrollbar">
                        {stats.recentJobs && stats.recentJobs.length > 0 ? (
                           stats.recentJobs.map((job, idx) => (
                              <div key={idx} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl text-left border border-white/5 group hover:border-brand-indigo/30 transition-all">
                                 <div className="w-8 h-8 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo"><Briefcase size={14} /></div>
                                 <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-white truncate">{job.company_name || job.companyName || 'New Company'}</p>
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black truncate">{job.job_role || job.jobRole || 'Application'}</p>
                                 </div>
                                 <p className="text-[9px] text-slate-500 font-bold whitespace-nowrap">{job.applied_date || job.appliedDate || 'Today'}</p>
                              </div>
                           ))
                        ) : (
                           <div className="py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
                              <p className="text-xs text-slate-600 italic">No recent applications found</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
             ) : (
               <div className="h-full w-full">
                 <AnimatePresence mode="wait">
                   {view === 'trend' ? (
                     <motion.div 
                       key="trend"
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 20 }}
                       className="h-full w-full"
                     >
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={filteredChartData}>
                              <defs>
                                <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#475569', fontSize: 10, fontWeight: '700' }}
                                dy={10}
                              />
                              <YAxis hide />
                              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1 }} />
                              <Area 
                                type="monotone" 
                                dataKey="applications" 
                                stroke="#6366f1" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorApps)" 
                                animationDuration={2500}
                                dot={{ r: 4, fill: '#6366f1', strokeWidth: 0, filter: 'drop-shadow(0 0 8px #6366f1)' }}
                                activeDot={{ r: 8, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }}
                              />
                           </AreaChart>
                        </ResponsiveContainer>
                     </motion.div>
                   ) : (
                     <motion.div 
                        key="distribution"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full w-full flex items-center justify-center p-4 bg-white/5 rounded-[2.5rem] border border-white/5"
                     >
                        <ResponsiveContainer width="100%" height={300}>
                           <BarChart data={weekdayData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: '700' }} />
                              <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                                contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} 
                                itemStyle={{ color: '#fff' }}
                              />
                              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                 {weekdayData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             )}
          </div>

          {/* Mini Analytics Panel (Right 30%) */}
          <div className="lg:col-span-3 space-y-6">
             {/* Progress Card */}
             <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                   <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Weekly Progress</h4>
                   <Target size={16} className="text-brand-indigo" />
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold text-white">
                      <span>7/10 Apps</span>
                      <span className="text-brand-indigo">70%</span>
                   </div>
                   <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '70%' }}
                        className="h-full bg-brand-indigo rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                      />
                   </div>
                </div>
             </div>

             {/* Mini Distribution Cards */}
             <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Stage Dist.</h4>
                <div className="h-[150px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={5}
                            dataKey="value"
                         >
                            {statusData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                            ))}
                         </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#020617', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} 
                            itemStyle={{ color: '#fff' }}
                          />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                   {statusData.map((s, idx) => (
                     <div key={s.name} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-[10px] font-bold text-slate-400">{s.name}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ApplicationInsights;
