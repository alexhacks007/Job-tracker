import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Building2, MapPin, DollarSign, Calendar, FileText, 
  CheckCircle, XCircle, Clock, Send, PhoneCall, Zap, Sparkles, ChevronRight, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import JobFormModal from '../components/JobFormModal';

const STATUS_CONFIG = {
  Applied:   { icon: Send,       color: 'bg-brand-indigo',    light: 'bg-brand-indigo/10 text-brand-indigo border-brand-indigo/20',   label: 'Applied',          desc: 'Transmission complete' },
  Pending:   { icon: Clock,      color: 'bg-slate-500',    light: 'bg-slate-500/10 text-slate-400 border-slate-500/20',      label: 'Pending',          desc: 'Awaiting sector response' },
  Called:    { icon: PhoneCall,  color: 'bg-brand-violet',  light: 'bg-brand-violet/10 text-brand-violet border-brand-violet/20', label: 'Verbal Sync', desc: 'Direct communication established' },
  Interview: { icon: Zap,        color: 'bg-brand-blue',  light: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20', label: 'Active Interview',       desc: 'Sync scheduled' },
  Offer:     { icon: Sparkles,   color: 'bg-emerald-500', light: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Contract Issued', desc: 'Success achieved' },
  Rejected:  { icon: XCircle,    color: 'bg-red-500',     light: 'bg-red-500/10 text-red-400 border-red-500/20',        label: 'Terminated',         desc: 'Opportunity archival' },
};

const STATUS_ORDER = ['Applied', 'Pending', 'Called', 'Interview', 'Offer', 'Rejected'];

const InfoItem = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-brand-indigo/10 group-hover:text-brand-indigo transition-all border border-white/5 group-hover:border-brand-indigo/20">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</p>
        <p className="text-sm font-bold text-white mt-0.5">{value}</p>
      </div>
    </div>
  );
};

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}/`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setJob(await res.json());
        else navigate('/jobs');
      } catch { toast.error('Cluster sync failed'); }
      finally { setLoading(false); }
    };
    fetchJob();
  }, [id, token, navigate]);

  const handleUpdateJob = async (updatedData) => {
    try {
      const res = await fetch(`/api/jobs/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        setJob({ ...job, ...updatedData });
        setIsEditModalOpen(false);
        toast.success('Grid synced successfully');
      } else {
        toast.error('Sync failure');
      }
    } catch {
      toast.error('Network disconnect. Edit failed.');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
       <div className="w-10 h-10 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin" />
       <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Decrypting Segment...</p>
    </div>
  );

  if (!job) return null;

  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG['Applied'];
  const currentIndex = STATUS_ORDER.indexOf(job.status);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Header Navigation */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-2">
         <button onClick={() => navigate('/jobs')} 
           className="w-full md:w-auto group flex items-center justify-center md:justify-start gap-3 px-6 py-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all shadow-lg active:scale-95">
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-black uppercase tracking-wider">Return to Grid</span>
         </button>
         
         <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-3 px-6 bg-white/[0.02] border border-white/5 rounded-2xl w-full md:w-auto">
            <span className={`w-full sm:w-auto text-center px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${cfg.light}`}>
               {cfg.label}
            </span>
            <div className="hidden sm:block w-px h-6 bg-white/10" />
            <span className="w-full sm:w-auto text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
               Added {new Date(job.created_at).toLocaleDateString()}
            </span>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-10">
            {/* Core Info Display */}
            <section className="glass rounded-[3.5rem] p-10 md:p-16 border border-white/5 relative overflow-hidden group">
               {/* Elegant Edit Button */}
               <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute top-6 right-6 md:top-10 md:right-10 z-20 flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] hover:bg-brand-indigo text-slate-300 hover:text-white rounded-full border border-white/10 hover:border-brand-indigo/50 transition-all duration-500 shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105"
               >
                  <Edit3 size={16} />
                  <span className="text-xs font-bold tracking-wider uppercase">Update</span>
               </button>

               <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12">
                  <Building2 size={160} className="text-brand-indigo" />
               </div>

               <div className="relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-brand-indigo/10 flex items-center justify-center text-brand-indigo mb-8 border border-brand-indigo/20 shadow-xl shadow-brand-indigo/10">
                     <Building2 size={32} />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-3">{job.job_role}</h1>
                  <p className="text-xl font-bold text-slate-400">{job.company_name}</p>

                  <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-10">
                     <InfoItem icon={MapPin} label="Deployment Location" value={job.location} />
                     <InfoItem icon={DollarSign} label="Compensation Matrix" value={job.salary} />
                     <InfoItem icon={Calendar} label="Engagement Date" value={job.applied_date} />
                     <InfoItem icon={Send} label="Transmission Route" value={job.platform} />
                  </div>
               </div>
            </section>

            {/* Notes Visualizer */}
            {job.notes && (
               <section className="glass rounded-[3rem] p-10 border border-white/5">
                  <div className="flex items-center gap-3 mb-8">
                     <div className="w-10 h-10 rounded-2xl bg-brand-violet/10 flex items-center justify-center text-brand-violet">
                        <FileText size={20} />
                     </div>
                     <h2 className="text-xl font-black text-white tracking-tight">Transmission Notes</h2>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5">
                     <p className="text-slate-400 leading-relaxed font-medium whitespace-pre-wrap">{job.notes}</p>
                  </div>
               </section>
            )}
         </div>

         {/* Sidebar: Status Timeline */}
         <div className="space-y-10">
            <section className="glass rounded-[3rem] p-10 border border-white/5">
               <h2 className="text-xl font-black text-white tracking-tight mb-8">Application Journey</h2>
               
               <div className="relative space-y-10">
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-white/5" />
                  
                  {STATUS_ORDER.map((status, idx) => {
                     const s = STATUS_CONFIG[status];
                     const isDone = idx < currentIndex;
                     const isCurrent = idx === currentIndex;
                     const isFuture = idx > currentIndex;
                     const SIcon = s.icon;

                     return (
                        <div key={status} className={`relative flex gap-6 transition-all duration-500 ${isFuture ? 'opacity-20 translate-x-1' : 'opacity-100'}`}>
                           <div className={`
                              relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500
                              ${isCurrent ? `${s.color} text-white shadow-2xl shadow-${s.color.split('-')[1]}/30 scale-110` : ''}
                              ${isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : ''}
                              ${isFuture ? 'bg-white/5 text-slate-600 border border-white/5' : ''}
                           `}>
                              {isDone ? <CheckCircle size={18} /> : <SIcon size={18} />}
                           </div>
                           
                           <div className="pt-1 flex-1 min-w-0">
                              <h3 className={`text-sm font-black uppercase tracking-widest ${isCurrent ? 'text-white' : 'text-slate-500'}`}>
                                 {s.label}
                              </h3>
                              {isCurrent && (
                                 <motion.p initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-xs font-bold text-slate-400 mt-1">
                                    {s.desc}
                                 </motion.p>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </section>

            {/* Quick Summary Card */}
            <div className="glass rounded-[2.5rem] p-8 border border-brand-indigo/20 bg-brand-indigo/5">
               <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="text-brand-indigo" size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-indigo">Efficiency Insights</span>
               </div>
               <p className="text-xs font-bold text-slate-400 leading-relaxed">
                  Your application for <span className="text-white">{job.job_role}</span> is progressing {currentIndex > 2 ? 'exceptionally well' : 'as expected'}. Keep your notes updated for better AI analysis later.
               </p>
            </div>

            {/* AI Match Score Card */}
            <div className="glass rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-brand-indigo/10 blur-[50px] scale-50 group-hover:scale-100 transition-all duration-700 pointer-events-none"></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                   <h3 className="text-sm font-bold text-white tracking-tight">AI Match Score</h3>
                   <span className="text-2xl font-black text-brand-indigo drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">78%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-6 relative z-10">
                   <div className="w-[78%] h-full bg-gradient-to-r from-brand-indigo to-brand-violet rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
                </div>
                <div className="space-y-3 relative z-10">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Skills matched</span>
                      <span className="text-white font-bold bg-white/5 px-2 py-1 rounded-lg">6/8</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Missing</span>
                      <span className="text-red-400 font-bold bg-red-400/10 px-2 py-1 rounded-lg border border-red-400/10">React Query, Docker</span>
                   </div>
                </div>
            </div>
         </div>
      </div>
      
      <JobFormModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSave={handleUpdateJob} 
        job={job} 
      />
    </div>
  );
};

export default JobDetail;

