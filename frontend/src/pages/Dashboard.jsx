import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles,
  Mail,
  Building2,
  Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatsCard from '../components/StatsCard';
import Skeleton from '../components/Skeleton';
import ApplicationInsights from '../components/ApplicationInsights';

// New Components
import InsightsPanel from '../components/InsightsPanel';
import FunnelChart from '../components/FunnelChart';
import Heatmap from '../components/Heatmap';
import StreakWidget from '../components/StreakWidget';
import AchievementBadge from '../components/AchievementBadge';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { token, user } = useAuth();
  
  // State for all data
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [funnelData, setFunnelData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [achievementsData, setAchievementsData] = useState({ achievements: [], streak: null });
  
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Parallel requests for speed
        const [
          resStats,
          resInsights,
          resFunnel,
          resHeatmap,
          resAchievements
        ] = await Promise.all([
          fetch('/api/dashboard/stats/', { headers }),
          fetch('/api/insights/', { headers }),
          fetch('/api/analytics/funnel/', { headers }),
          fetch('/api/analytics/heatmap/', { headers }),
          fetch('/api/achievements/', { headers })
        ]);

        if (resStats.ok) setStats(await resStats.json());
        if (resInsights.ok) setInsights((await resInsights.json()).insights);
        if (resFunnel.ok) setFunnelData((await resFunnel.json()).data);
        if (resHeatmap.ok) setHeatmapData((await resHeatmap.json()).data);
        if (resAchievements.ok) setAchievementsData((await resAchievements.json()).data);
        
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch standard data if not an admin dashboard viewer
    if (!user?.permissions?.includes('ALL') && !user?.permissions?.includes('SYSTEM_CONTROL')) {
      fetchDashboardData();
    } else {
      setLoading(false); // AdminDashboard handles its own loading
    }
  }, [token, timeRange, user]);

  // Permission check to hijack the render flow
  if (user?.permissions && (user.permissions.includes('ALL') || user.permissions.includes('SYSTEM_CONTROL') || user.permissions.includes('USER_MANAGEMENT'))) {
    return <AdminDashboard />;
  }

  if (loading || !stats) return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center h-12">
        <Skeleton className="w-48 h-10" />
        <Skeleton className="w-40 h-10" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-[2.5rem]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Skeleton className="lg:col-span-1 h-[450px] rounded-[2.5rem]" />
        <Skeleton className="lg:col-span-2 h-[450px] rounded-[2.5rem]" />
      </div>
    </div>
  );

  const responseRate = Math.round((stats.interviews / (stats.applied || 1)) * 100);

  return (
    <div className="space-y-6 md:space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            Mission Control <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-brand-violet shrink-0" />
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base font-medium">AI-Powered Career Operating System</p>
        </div>
        <div className="w-full sm:w-auto flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner">
           {['7', '30', '90'].map(range => (
             <button 
               key={range}
               onClick={() => setTimeRange(range)}
               className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all ${timeRange === range ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20 scale-[1.02]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
             >
               Last {range}d
             </button>
           ))}
        </div>
      </div>

      {/* Top Main Grid: Insights & Gamification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <InsightsPanel insights={insights} />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StreakWidget streak={achievementsData.streak} />
            <div className="glass-card p-5 sm:p-6">
              <h4 className="text-slate-400 font-medium text-xs sm:text-sm mb-4 uppercase tracking-widest">Application Funnel</h4>
              <FunnelChart data={funnelData} />
            </div>
          </div>
          
          {/* Achievements Row */}
          <div className="glass-card p-5 sm:p-6">
             <h4 className="text-slate-400 font-medium text-xs sm:text-sm mb-4 uppercase tracking-widest">Recent Achievements</h4>
             <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {achievementsData.achievements && achievementsData.achievements.map((ach) => (
                  <AchievementBadge key={ach.id} achievement={ach} />
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard 
          title="Total Applications" 
          value={stats.applied} 
          icon={Briefcase} 
          color="bg-brand-blue" 
          trend="up" trendValue={insights?.weeklyChange?.percentage || "12"} 
        />
        <StatsCard 
          title="Interviews" 
          value={stats.interviews} 
          icon={Clock} 
          color="bg-brand-violet" 
          trend="up" trendValue="5" 
        />
        <StatsCard 
          title="Offers Received" 
          value={stats.offers} 
          icon={CheckCircle2} 
          color="bg-emerald-500" 
        />
        <StatsCard 
          title="Conversion Rate" 
          value={insights?.conversionRates?.interviewRate || responseRate} 
          icon={TrendingUp} 
          color="bg-orange-500" 
          trend="up" trendValue="8"
        />
      </div>

      {/* Advanced Outreach & Company Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top 5 Most Applied Companies Bar Chart or List */}
        <div className="glass-card p-5 sm:p-6 lg:col-span-2 border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-indigo/5 blur-3xl -z-10 rounded-full" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Building2 className="text-brand-indigo w-4 h-4" /> Top Target Companies Analysis
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Velocity View</span>
          </div>
          
          <div className="space-y-4">
            {stats.topCompanies && stats.topCompanies.length > 0 ? (
              stats.topCompanies.map((company, index) => {
                const colors = ['bg-brand-indigo', 'bg-brand-blue', 'bg-brand-violet', 'bg-emerald-500', 'bg-orange-500'];
                const maxCount = Math.max(...stats.topCompanies.map(c => c.count)) || 1;
                const percentage = Math.round((company.count / maxCount) * 100);
                
                return (
                  <div key={company.name} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colors[index % colors.length]}`} />
                        {company.name}
                      </span>
                      <span className="text-white">{company.count} {company.count === 1 ? 'Application' : 'Applications'}</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${colors[index % colors.length]} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-center text-slate-500">
                <Briefcase size={24} className="mb-2 opacity-50" />
                <p className="text-xs">No company applications found. Link companies inside opportunities.</p>
              </div>
            )}
          </div>
        </div>

        {/* Outreach Funnel Integration card */}
        <div className="glass-card p-5 sm:p-6 border border-white/5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-violet/5 blur-3xl -z-10 rounded-full" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 mb-2">
              <Mail className="text-brand-violet w-4 h-4" /> Outreach Success Rate
            </h3>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Bulk email campaigns results and recruiter engagement.</p>
          </div>
          
          <div className="my-6 flex items-center justify-center relative">
            <div className="w-28 h-28 rounded-full border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-brand-indigo/5 blur-lg" />
              <span className="text-3xl font-black text-white relative z-10">{stats.totalOutreaches || '0'}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest relative z-10">Outreaches</span>
            </div>
            
            {/* Ambient animation glow */}
            <div className="absolute w-32 h-32 border border-brand-indigo/20 rounded-full animate-ping opacity-5 pointer-events-none" />
          </div>

          <div className="space-y-2.5">
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Targeted Companies</span>
                <span className="text-white font-bold bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5">{stats.totalCompanies || '0'} Total</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Campaign Mode</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/10">Active Sentinel</span>
             </div>
          </div>
        </div>
      </div>

      {/* GitHub Style Heatmap */}
      <div className="glass-card p-5 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             Activity Heatmap
           </h3>
           <span className="text-xs text-brand-indigo bg-brand-indigo/10 px-3 py-1 rounded-full font-bold w-fit">Past 120 Days</span>
        </div>
        <div className="overflow-x-auto no-scrollbar scroll-smooth">
          <div className="min-w-[650px] md:min-w-0">
            <Heatmap data={heatmapData} />
          </div>
        </div>
      </div>

      {/* Traditional Analytics (Area Chart) */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[650px] lg:min-w-0">
          <ApplicationInsights stats={stats} />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
