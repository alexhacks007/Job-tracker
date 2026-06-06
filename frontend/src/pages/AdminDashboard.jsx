import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Users, Activity, Briefcase, Zap, AlertTriangle, ShieldCheck, TrendingDown, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden group">
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${color} opacity-10 group-hover:scale-150 transition-transform duration-500`} />
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
    </div>
    <div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm font-medium text-slate-400">{title}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    const fetchAdminStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard/admin/?days=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setStats(await res.json());
      } catch (err) {
        toast.error('Failed to load global admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, [token, timeRange]);

  const handleSendNudge = async (userId, userName) => {
    try {
      const res = await fetch(`/api/rbac/users/${userId}/nudge/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: `Hey ${userName}, our system detected a slight dip in your activity. Don't lose momentum! You've got this.` 
        })
      });
      if (res.ok) {
        toast.success(`Nudge successfully delivered to ${userName}`);
      } else {
        toast.error("Failed to send nudge");
      }
    } catch (err) {
      toast.error("Network error while nudging user");
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-8 pb-12">
        <Skeleton className="w-1/3 h-10" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            System Overseer <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Global AI Analytics & User Control Center</p>
        </div>
        <div className="w-full md:w-auto flex gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
           {['7', '30', '90', '365'].map(range => (
             <button 
               key={range}
               onClick={() => setTimeRange(range)}
               className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-bold transition-all ${timeRange === range ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20 scale-[1.02]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
             >
               Last {range}d
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatsCard title="Total Platform Users" value={stats.totalUsers} icon={Users} color="bg-brand-indigo" />
         <StatsCard title="Global Applications" value={stats.totalJobs} icon={Briefcase} color="bg-brand-blue" />
         <StatsCard title="Interviews Secured" value={stats.totalInterviews} icon={Activity} color="bg-brand-violet" />
         <StatsCard title="System Health" value="99.9%" icon={Zap} color="bg-emerald-500" />
      </div>

      {/* Advanced Global Analytics Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Main Timeseries Chart */}
        <div className="glass-card p-6 lg:col-span-2 relative overflow-hidden">
           <h3 className="text-lg font-bold text-white mb-6">Global Application Velocity</h3>
           <div className="h-[300px]">
             {stats.globalChartData?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={stats.globalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorGlobalApps" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                       <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                   <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(tick) => new Date(tick).toLocaleDateString(undefined, {month:'short', day:'numeric'})} />
                   <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                     itemStyle={{ color: '#fff' }}
                   />
                   <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorGlobalApps)" />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-500">No data available for this range.</div>
             )}
           </div>
        </div>

        {/* Global Pipeline Distribution */}
        <div className="glass-card p-6">
           <h3 className="text-lg font-bold text-white mb-4">Pipeline Distribution</h3>
           <div className="h-[250px] mt-4">
             {stats.statusDistribution?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats.statusDistribution} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                      {stats.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-500">No data available.</div>
             )}
           </div>
           <div className="flex flex-wrap gap-2 mt-2 justify-center">
             {stats.statusDistribution?.map((s, i) => (
               <div key={s.name} className="flex items-center gap-2 text-xs text-slate-300">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                 {s.name}
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* Top Target Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="glass-card p-6 border-brand-violet/20 border">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Target className="text-brand-violet" /> Top Target Companies
          </h3>
          <div className="h-[250px]">
             {stats.topCompanies?.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.topCompanies} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="#10b981" />
                       <stop offset="100%" stopColor="#047857" />
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#ffffff00" vertical={false} />
                   <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                   <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                   <Bar dataKey="applications" fill="url(#barColor)" radius={[4, 4, 0, 0]} barSize={40} />
                 </BarChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-500">No data available.</div>
             )}
          </div>
        </div>

        {/* User Mindset & Risk Analytics */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
               <AlertTriangle className="text-orange-500" /> Burnout Risk Radar
             </h3>
             <span className="text-xs bg-orange-500/10 text-orange-500 font-bold px-3 py-1 rounded-full uppercase tracking-widest">Action Needed</span>
          </div>
          
          <div className="space-y-4">
             {stats.recentRiskUsers.map(u => (
               <div key={u.id} className="glass p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-800 flex items-center justify-center text-white font-bold">{u.name.charAt(0)}</div>
                    <div>
                      <p className="text-white font-bold text-sm">{u.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><TrendingDown size={12} className="text-red-400" /> {u.dropRate}% Drop in Motivation</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSendNudge(u.id, u.name)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition-colors"
                  >
                    Send Nudge
                  </button>
               </div>
             ))}
          </div>
        </div>

        {/* Global System AI Insights */}
        <div className="glass-card p-6 border-brand-indigo/20 border overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-indigo/5 blur-3xl rounded-full -z-10" />
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
             <Zap className="text-brand-indigo" /> Sentinel AI Report
          </h3>
          <div className="space-y-6">
             <div className="p-4 rounded-2xl bg-brand-indigo/10 border border-brand-indigo/20">
                <p className="text-brand-indigo font-bold text-sm mb-1">Surge Detected</p>
                <p className="text-white text-sm">Platform activity is up 42% this week. Users are responding well to the Monday notification nudges.</p>
             </div>
             <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-emerald-500 font-bold text-sm mb-1">High Conversion Active</p>
                <p className="text-white text-sm">Global interview conversion rate holds steady at 12%. No systemic application bottlenecks found.</p>
             </div>
             <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20">
                <p className="text-orange-500 font-bold text-sm mb-1">Feature Usage Drop</p>
                <p className="text-white text-sm">Interaction with the 'Tasks' module is trailing. Recommend injecting a UI tooltip for inactive users.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
