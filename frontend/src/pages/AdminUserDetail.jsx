import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Mail, Calendar, LogIn, Briefcase, CheckSquare, Activity, List, Target, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || id === 'undefined') {
      toast.error('Invalid User Identity ID');
      navigate('/admin/users');
      return;
    }
    
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/rbac/users/${id}/full-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setData(await res.json());
        } else {
          toast.error('Failed to load user profile');
          navigate('/admin/users');
        }
      } catch (err) {
        toast.error('Server error');
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, token, navigate]);

  const handleSendNudge = async () => {
    try {
      const res = await fetch(`/api/rbac/users/${id}/nudge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: `Administrative Alert: Your profile consistency is currently being monitored by the Sentinel AI. We recommend updating your task list to maintain high visibility.` 
        })
      });
      if (res.ok) {
        toast.success(`Nudge successfully delivered to identity sentinel`);
        // Refresh data to show in timeline
        const refreshRes = await fetch(`/api/rbac/users/${id}/full-profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (refreshRes.ok) setData(await refreshRes.json());
      } else {
        toast.error("Failed to send nudge");
      }
    } catch (err) {
      toast.error("Network error while nudging user");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-brand-indigo border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data || !data.user) return null;

  const { user, timeline, behaviorMetrics, jobStats, aiInsights, riskAnalysis } = data;

  const radarData = [
    { subject: 'Consistency', A: behaviorMetrics.consistency_score, fullMark: 100 },
    { subject: 'Focus', A: behaviorMetrics.focus_score, fullMark: 100 },
    { subject: 'Speed', A: behaviorMetrics.action_speed, fullMark: 100 },
    { subject: 'Load', A: behaviorMetrics.cognitive_load, fullMark: 100 },
    { subject: 'Drop Rate', A: behaviorMetrics.drop_rate, fullMark: 100 },
  ];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Container */}
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/users')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <User className="text-brand-indigo" /> User Analytics View
            </h1>
            <p className="text-slate-400 mt-1 font-medium">Deep dive into real-time identity behavior and metrics.</p>
          </div>
        </div>
        
        {/* Risk Assessment Engine Profile */}
        <div className={`px-6 py-3 rounded-2xl border flex items-center gap-4 ${
          riskAnalysis.riskScore === 'HIGH' ? 'bg-red-500/10 border-red-500/30' :
          riskAnalysis.riskScore === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/30' :
          'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identity Risk</p>
             <p className={`text-xl font-black ${
               riskAnalysis.riskScore === 'HIGH' ? 'text-red-500' :
               riskAnalysis.riskScore === 'MEDIUM' ? 'text-amber-500' :
               'text-emerald-500'
             }`}>{riskAnalysis.riskScore}</p>
          </div>
          <div className="w-px h-8 bg-white/10 mx-2"></div>
          <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active</p>
             <p className="text-xl font-black text-white">{riskAnalysis.daysActive} <span className="text-sm font-medium text-slate-400">Days</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Core Identity */}
        <div className="space-y-8 lg:col-span-1">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="glass-card p-6 border-t-4 border-brand-indigo relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/10 blur-3xl -z-10 rounded-full"></div>
            <div className="flex flex-col items-center text-center">
               <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-indigo to-brand-violet flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-brand-indigo/20 mb-4 overflow-hidden border-2 border-surface-800">
                 {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name.charAt(0)}
               </div>
               <h2 className="text-2xl font-bold text-white">{user.name}</h2>
               <p className="text-slate-400 flex items-center gap-1 justify-center mt-1"><Mail size={14}/> {user.email}</p>
               <span className="mt-4 px-4 py-1.5 bg-brand-indigo/20 text-brand-indigo border border-brand-indigo/30 rounded-full text-sm font-bold uppercase tracking-wider">
                 {user.role}
               </span>
            </div>

            <div className="mt-8 space-y-4">
              <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 relative overflow-hidden">
                {user.isOnline && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 blur-xl rounded-full"></div>}
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Activity size={14} className={user.isOnline ? 'text-emerald-500 animate-pulse' : ''}/> Application Status
                </p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`}></div>
                  <p className={`font-medium ${user.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {user.isOnline ? 'Currently Online' : (
                       user.last_active_at ? 
                         `Offline (Active ${Math.floor((Date.now() - new Date(user.last_active_at).getTime()) / 60000)}m ago)` : 
                         'Offline (Inactive)'
                    )}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-1"><Calendar size={14}/> Account Created</p>
                <p className="text-white font-medium">{new Date(user.created_at).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-1"><LogIn size={14}/> Last Authentication</p>
                <p className="text-white font-medium">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-brand-indigo/5 rounded-xl border border-brand-indigo/10 text-center">
                   <Target className="w-6 h-6 text-brand-indigo mx-auto mb-2 opacity-50" />
                   <p className="text-2xl font-black text-white">{user.totalJobs}</p>
                   <p className="text-xs font-bold text-brand-indigo uppercase">Total Jobs</p>
                </div>
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-center">
                   <CheckSquare className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-50" />
                   <p className="text-2xl font-black text-white">{user.totalTodos}</p>
                   <p className="text-xs font-bold text-emerald-500 uppercase">Tasks</p>
                </div>
                <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 text-center">
                   <Briefcase className="w-6 h-6 text-amber-500 mx-auto mb-2 opacity-50" />
                   <p className="text-2xl font-black text-white">{user.totalCompanies}</p>
                   <p className="text-xs font-bold text-amber-500 uppercase">Companies</p>
                </div>
                <div className="p-4 bg-fuchsia-500/5 rounded-xl border border-fuchsia-500/10 text-center">
                   <Activity className="w-6 h-6 text-fuchsia-500 mx-auto mb-2 opacity-50" />
                   <p className="text-2xl font-black text-white">{user.totalAchievements}</p>
                   <p className="text-xs font-bold text-fuchsia-500 uppercase">Badges</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Behavior Radar */}
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="glass-card p-6 border-l-4 border-brand-violet">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <Activity className="text-brand-violet" /> Behavioral Matrix
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Radar name="Metrics" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#8b5cf6' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Deep Analytics & Timeline */}
        <div className="space-y-8 lg:col-span-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="glass-card p-6 outline outline-1 outline-white/5">
              <h3 className="text-lg font-bold text-white mb-6">Job Application Distribution</h3>
              {jobStats.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-slate-500">No application data.</div>
              ) : (
                <div className="h-48 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={jobStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                      >
                        {jobStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                    <p className="text-3xl font-black text-white">{user.totalJobs}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase">Total Tracked</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* AI Custom Sub-dashboard */}
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="glass-card p-6 bg-gradient-to-br from-surface-900 to-indigo-950/30">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target className="text-brand-indigo" /> User AI Insights
              </h3>
              {aiInsights && aiInsights.length > 0 ? (
                <div className="space-y-3">
                  {aiInsights.map((insight, idx) => (
                    <div key={idx} className="p-3 bg-brand-indigo/10 border border-brand-indigo/20 rounded-xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-brand-indigo rounded-l-xl opacity-50"></div>
                      <p className="text-xs font-bold text-brand-indigo tracking-wider uppercase mb-1">{insight.insight_type}</p>
                      <p className="text-sm text-slate-300 leading-snug">{insight.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 border-2 border-dashed border-white/10 rounded-2xl flex flex-col justify-center items-center text-center p-4">
                   <Target className="w-8 h-8 text-slate-500 mb-2 opacity-50" />
                   <p className="text-slate-400 text-sm">Not enough data points yet for AI insights generation.</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* New High-Level Velocity Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.35}} className="glass-card p-6 border-t-4 border-emerald-500/50 lg:col-span-2">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2">
                   <Activity className="text-emerald-500" /> Platform Engagement Heatmap (Last 180 Days)
                 </h3>
                 <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Least Active</span>
                    <div className="flex gap-1">
                       <div className="w-3 h-3 rounded bg-slate-800"></div>
                       <div className="w-3 h-3 rounded bg-brand-indigo/30"></div>
                       <div className="w-3 h-3 rounded bg-brand-indigo/60"></div>
                       <div className="w-3 h-3 rounded bg-brand-indigo"></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Most Active</span>
                 </div>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                 {[...Array(180)].map((_, i) => {
                    const date = new Date(Date.now() - (179 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const record = data.heatmapData.find(h => h.date === date);
                    const intensity = record ? Math.min(record.count, 5) : 0;
                    return (
                       <div 
                         key={i} 
                         className={`w-[13px] h-[13px] rounded-sm transition-all hover:scale-150 cursor-pointer ${
                           intensity === 0 ? 'bg-slate-800' :
                           intensity === 1 ? 'bg-brand-indigo/20' :
                           intensity === 2 ? 'bg-brand-indigo/40' :
                           intensity === 3 ? 'bg-brand-indigo/60' :
                           intensity === 4 ? 'bg-brand-indigo/80' : 'bg-brand-indigo shadow-[0_0_4px_rgba(99,102,241,0.5)]'
                         }`}
                         title={`${date}: ${record ? record.count : 0} interactions`}
                       />
                    );
                 })}
              </div>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.4}} className="glass-card p-6">
               <h3 className="text-lg font-bold text-white mb-6">Recent Application Velocity</h3>
               <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.pipelineTrend}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTrend)" />
                    </AreaChart>
                  </ResponsiveContainer>
               </div>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.45}} className="glass-card p-6 border-l-4 border-amber-500">
               <h3 className="text-lg font-bold text-white mb-4">Identity Control Hub</h3>
               <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-center transition-all group scale-100 active:scale-95" onClick={() => toast.success('Report generation started...')}>
                     <List className="w-6 h-6 text-brand-indigo mx-auto mb-2" />
                     <p className="text-xs font-bold text-white uppercase">Export PDF</p>
                  </button>
                  <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-center transition-all group scale-100 active:scale-95" onClick={handleSendNudge}>
                     <Activity className="text-emerald-500 w-6 h-6 mx-auto mb-2" />
                     <p className="text-xs font-bold text-white uppercase">Send Nudge</p>
                  </button>
                  <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-center transition-all group scale-100 active:scale-95">
                     <Target className="text-brand-violet w-6 h-6 mx-auto mb-2" />
                     <p className="text-xs font-bold text-white uppercase">Edit Goals</p>
                  </button>
                  <button className="p-4 bg-red-500/10 hover:bg-red-500/20 rounded-2xl text-center transition-all group scale-100 active:scale-95" onClick={() => toast.error('Account Suspension feature coming soon.')}>
                     <ShieldAlert className="text-red-500 w-6 h-6 mx-auto mb-2" />
                     <p className="text-xs font-bold text-white uppercase">Restrict</p>
                  </button>
               </div>
            </motion.div>
          </div>

          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.5}} className="glass-card p-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
               <List className="text-brand-indigo" /> Comprehensive Event History
            </h3>
            
            <div className="max-h-[600px] overflow-y-auto pr-4 space-y-6 relative border-l-2 border-brand-indigo/20 ml-4 py-2">
              {timeline.length === 0 ? (
                <p className="text-slate-500 italic pl-6">No historical records found for this identity.</p>
              ) : (
                timeline.map((log, i) => (
                  <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{delay: i > 20 ? 0 : i*0.05}} key={i} className="pl-6 relative group">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-surface-900 border-2 border-brand-indigo flex items-center justify-center group-hover:scale-125 transition-transform group-hover:border-white">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo group-hover:bg-white transition-colors" />
                    </div>
                    <div className="p-4 bg-slate-900/50 hover:bg-slate-800/80 rounded-xl transition-colors border border-white/5">
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <p className="text-sm font-bold text-white leading-relaxed">{log.detail}</p>
                        <span className={`uppercase text-[10px] font-black tracking-wider px-2 py-1 rounded-md whitespace-nowrap ${
                          log.source === 'login' ? 'bg-brand-violet/20 text-brand-violet' :
                          log.source === 'job' ? 'bg-emerald-500/20 text-emerald-500' :
                          'bg-brand-indigo/20 text-brand-indigo'
                        }`}>
                          {log.source}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {new Date(log.created_at).toLocaleString(undefined, {
                           year: 'numeric', month: 'short', day: 'numeric',
                           hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
