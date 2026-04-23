import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles
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
          fetch('/api/dashboard/stats', { headers }),
          fetch('/api/insights', { headers }),
          fetch('/api/analytics/funnel', { headers }),
          fetch('/api/analytics/heatmap', { headers }),
          fetch('/api/achievements', { headers })
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
    <div className="space-y-8 pb-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            Mission Control <Sparkles className="w-6 h-6 text-brand-violet" />
          </h1>
          <p className="text-slate-400 mt-1 font-medium">AI-Powered Career Operating System</p>
        </div>
        <div className="w-full md:w-auto flex gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
           {['7', '30', '90'].map(range => (
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

      {/* Top Main Grid: Insights & Gamification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <InsightsPanel insights={insights} />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StreakWidget streak={achievementsData.streak} />
            <div className="glass-card p-6">
              <h4 className="text-slate-400 font-medium text-sm mb-4 uppercase tracking-widest">Application Funnel</h4>
              <FunnelChart data={funnelData} />
            </div>
          </div>
          
          {/* Achievements Row */}
          <div className="glass-card p-6">
             <h4 className="text-slate-400 font-medium text-sm mb-4 uppercase tracking-widest">Recent Achievements</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {achievementsData.achievements && achievementsData.achievements.map((ach) => (
                 <AchievementBadge key={ach.id} achievement={ach} />
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* GitHub Style Heatmap */}
      <div className="glass-card p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-lg font-bold text-white flex items-center gap-2">
             Activity Heatmap
           </h3>
           <span className="text-xs text-brand-indigo bg-brand-indigo/10 px-3 py-1 rounded-full font-bold">Past 120 Days</span>
        </div>
        <Heatmap data={heatmapData} />
      </div>

      {/* Traditional Analytics (Area Chart) */}
      <ApplicationInsights stats={stats} />

    </div>
  );
};

export default Dashboard;
