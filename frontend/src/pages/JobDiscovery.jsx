import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Briefcase, MapPin, DollarSign, Clock, ExternalLink,
  BookmarkPlus, Wifi, Filter, ChevronDown, RefreshCw, Globe,
  Tag, Building2, CheckCircle, Loader2, AlertCircle, Sparkles, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';

const stripHtml = (html) => {
  if (!html) return '';
  // Use regex to strip HTML tags to prevent the browser from loading tracking pixels (imgs)
  return html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return `${Math.floor(diff / 7)}w ago`;
};

const CATEGORIES = [
  { value: '', label: 'All Fields' },
  { value: 'software-dev', label: 'Engineering' },
  { value: 'design', label: 'Design' },
  { value: 'product', label: 'Product' },
  { value: 'data', label: 'Data & AI' },
  { value: 'marketing', label: 'Growth' },
];

const JobCard = React.forwardRef(({ job, onSave, savingId, saved }, ref) => {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const desc = stripHtml(job.description || '');
  const preview = desc.slice(0, 160).trim();
  const isSaving = savingId === job.id;

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="glass group p-6 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all hover:shadow-2xl hover:shadow-brand-indigo/5"
    >
      <div className="flex items-start gap-5">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 overflow-hidden flex-shrink-0">
          {(job.company_logo && !imgError) ? (
            <img 
              src={`https://images.weserv.nl/?url=${encodeURIComponent(job.company_logo)}`} 
              alt={job.company_name} 
              className="w-full h-full object-contain p-2" 
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-brand-indigo/10 text-brand-indigo font-bold text-xl">
              {job.company_name?.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-indigo">{job.platform}</span>
              <div className="h-1 w-1 rounded-full bg-slate-700" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{timeAgo(job.publication_date)}</span>
           </div>
           <h3 className="text-lg font-bold text-white tracking-tight leading-tight group-hover:text-brand-indigo transition-colors line-clamp-1">
             {job.title}
           </h3>
           <p className="text-sm font-bold text-slate-400 mt-1 flex items-center gap-1.5">
             <Building2 size={12} /> {job.company_name}
           </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-5">
        {job.location && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-slate-400 border border-white/5">
            <MapPin size={10} className="text-brand-blue" /> {job.location}
          </span>
        )}
        {job.salary && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
            <DollarSign size={10} /> {job.salary}
          </span>
        )}
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold text-slate-400 border border-white/5">
          <Tag size={10} className="text-brand-violet" /> {job.category}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          {expanded ? desc : preview}{desc.length > 160 && !expanded ? '...' : ''}
        </p>
        
        <div className="flex gap-3 pt-2">
          <a href={job.url} target="_blank" rel="noopener noreferrer"
            className="flex-1 btn-primary py-2.5 text-[11px] flex items-center justify-center gap-2">
            <Send size={14} /> Quick Apply
          </a>
          <button onClick={() => onSave(job)} disabled={isSaving || saved}
            className={`flex items-center justify-center w-12 h-10 rounded-2xl border transition-all
              ${saved 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-white'}`}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle size={16} /> : <BookmarkPlus size={16} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

const SkeletonCard = () => (
  <div className="glass rounded-[2.5rem] p-6 border border-white/5 space-y-6">
    <div className="flex gap-5">
      <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <Skeleton className="h-2 w-24 rounded-full" />
        <Skeleton className="h-4 w-3/4 rounded-full" />
      </div>
    </div>
    <div className="flex gap-2">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-16 rounded-full" />)}
    </div>
    <div className="space-y-2">
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-2 w-2/3 rounded-full" />
    </div>
    <div className="flex gap-3 pt-2">
      <Skeleton className="h-10 flex-1 rounded-2xl" />
      <Skeleton className="h-10 w-12 rounded-2xl" />
    </div>
  </div>
);

const JobDiscovery = () => {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [category, setCategory] = useState('software-dev');
  const [activeTab, setActiveTab] = useState('local');
  const [savingId, setSavingId] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'remote') {
        const params = new URLSearchParams({ limit: 40 });
        const combinedSearch = [search, locationSearch].filter(Boolean).join(' ');
        if (combinedSearch) params.set('search', combinedSearch);
        if (category) params.set('category', category);
        const res = await fetch(`https://remotive.com/api/remote-jobs?${params.toString()}`);
        if (!res.ok) throw new Error('API Sync Error');
        const data = await res.json();
        setJobs((data.jobs || []).map(j => ({
          id: j.id, title: j.title, company_name: j.company_name, company_logo: j.company_logo,
          location: j.candidate_required_location || 'Remote', salary: j.salary, publication_date: j.publication_date,
          url: j.url, description: j.description, category: j.category, platform: 'Remotive'
        })));
      } else {
        // Local India Search via Backend Proxy (Adzuna)
        const params = new URLSearchParams({ 
          q: search || 'software engineer', 
          l: locationSearch || 'india' 
        });
        const res = await fetch(`/api/jobs/local/?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Local Sync Error');
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) { setError('Network connectivity issue. Please try again.'); }
    finally { setLoading(false); }
  }, [category, search, activeTab, token]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchJobs(), 500);
    return () => clearTimeout(debounce);
  }, [fetchJobs]);

  const handleSaveToTracker = async (job) => {
    setSavingId(job.id);
    try {
      const res = await fetch('/api/jobs/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          company_name: job.company_name, job_role: job.title, location: job.location,
          salary: job.salary || '', status: 'Applied', platform: 'Remote Discovery'
        }),
      });
      if (res.ok) {
        setSavedIds(prev => new Set([...prev, job.id]));
        toast.success('Opportunity tracked!');
      }
    } catch { toast.error('Server sync failed'); }
    finally { setSavingId(null); }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Search Header */}
      <section className="relative overflow-hidden glass rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-16 border border-white/5">
         <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles size={80} className="text-brand-indigo md:w-[120px] md:h-[120px]" />
         </div>

         <div className="max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-[10px] font-black uppercase tracking-widest mb-6">
               <Wifi size={10} className="animate-pulse" /> Live Market Analytics
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none">
               Discover your <span className="gradient-text">next move.</span>
            </h1>
            <p className="text-slate-400 mt-4 text-sm font-medium">Real-time worldwide opportunities filtered specifically for your stack.</p>
         </div>

         <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-indigo transition-all" size={18} />
               <input type="text" placeholder="Design, Engineering, Data..." value={search} onChange={e => setSearch(e.target.value)}
                 className="w-full pl-12 pr-4 py-4 glass border-white/5 rounded-3xl outline-none focus:ring-2 focus:ring-brand-indigo/20 text-white font-medium" />
            </div>
             <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <select 
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 glass border-white/5 rounded-3xl outline-none focus:ring-2 focus:ring-brand-indigo/20 text-white font-medium appearance-none"
                >
                   <option value="">Remote Worldwide</option>
                   <option value="India">India (All)</option>
                   <option value="Bangalore">Bangalore</option>
                   <option value="Hyderabad">Hyderabad</option>
                   <option value="Chennai">Chennai</option>
                   <option value="Pune">Pune</option>
                   <option value="Mumbai">Mumbai</option>
                   <option value="Delhi">Delhi / NCR</option>
                   <option value="Remote India">Remote India</option>
                   <option value="North America">North America</option>
                   <option value="Europe">Europe</option>
                </select>
             </div>
            <button onClick={fetchJobs} className="btn-primary flex items-center justify-center gap-2 animate-glow">
               <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> Refresh Sync
            </button>
         </div>
      </section>

       {/* Discovery Tabs */}
       <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('local')}
            className={`flex-1 py-4 rounded-3xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'local' ? 'bg-brand-indigo text-white' : 'glass text-slate-500'}`}>
            Local Market (India)
          </button>
          <button onClick={() => setActiveTab('remote')}
            className={`flex-1 py-4 rounded-3xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'remote' ? 'bg-brand-indigo text-white' : 'glass text-slate-500'}`}>
            Global Remote
          </button>
       </div>
      <section className="glass rounded-[2.5rem] p-8 border border-brand-indigo/10 bg-brand-indigo/[0.02]">
         <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
               <Sparkles size={20} />
            </div>
            <div>
               <h2 className="text-lg font-black text-white">Deep Search Matrix</h2>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cross-Platform Sync</p>
            </div>
         </div>

         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'LinkedIn', icon: Globe, color: 'hover:bg-blue-600', url: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(search)}&location=${encodeURIComponent(locationSearch || 'India')}` },
              { name: 'Naukri', icon: Briefcase, color: 'hover:bg-brand-indigo', url: `https://www.naukri.com/${search.replace(/\s+/g, '-')}-jobs-in-${(locationSearch || 'india').toLowerCase().replace(/\s+/g, '-')}` },
              { name: 'WorkIndia', icon: Building2, color: 'hover:bg-emerald-600', url: `https://www.workindia.in/jobs-in-${(locationSearch || 'bangalore').toLowerCase()}/?search=${encodeURIComponent(search)}` },
              { name: 'Glassdoor', icon: Search, color: 'hover:bg-brand-violet', url: `https://www.glassdoor.co.in/Job/jobs.htm?sc.keyword=${encodeURIComponent(search)}&locId=1&locT=C&locName=${encodeURIComponent(locationSearch || 'India')}` },
            ].map(platform => (
              <a 
                key={platform.name} 
                href={platform.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-white/5 border border-white/5 transition-all ${platform.color} group hover:scale-105`}
              >
                 <platform.icon size={24} className="text-slate-400 group-hover:text-white transition-colors" />
                 <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-white">{platform.name}</span>
              </a>
            ))}
         </div>
         <p className="mt-6 text-center text-[10px] font-medium text-slate-600 italic">
            * Note: These platforms require direct authentication. We've pre-filtered the results for your current stack and location.
         </p>
      </section>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 px-2">
         {CATEGORIES.map(cat => (
           <button key={cat.value} onClick={() => setCategory(cat.value)}
             className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all
               ${category === cat.value ? 'bg-brand-indigo text-white shadow-xl shadow-brand-indigo/20' : 'glass text-slate-500 hover:text-white border-white/5 hover:border-white/10'}`}>
             {cat.label}
           </button>
         ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           {[...Array(9)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="glass rounded-[3rem] p-20 text-center border border-red-500/10">
           <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
           <p className="text-white font-bold text-xl">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           <AnimatePresence mode="popLayout">
             {jobs.map(job => (
               <JobCard key={job.id} job={job} onSave={handleSaveToTracker} savingId={savingId} saved={savedIds.has(job.id)} />
             ))}
           </AnimatePresence>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="pt-10 flex flex-col items-center gap-2 opacity-50">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">End of Spectrum</p>
           <div className="w-1 h-20 bg-gradient-to-b from-brand-indigo to-transparent" />
        </div>
      )}
    </div>
  );
};

export default JobDiscovery;

