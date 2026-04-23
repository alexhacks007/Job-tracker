import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Eye, 
  Edit3, 
  Trash2, 
  ArrowUpRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const statusStyles = {
  Applied:   'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  Interview: 'bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-orange-500/10',
  Offer:     'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/10',
  Rejected:  'bg-red-500/10 text-red-500 border-red-500/20',
  Pending:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const JobCard = ({ job, isAdmin, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const getDaysAgo = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days} days ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6, shadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
      className="glass p-6 rounded-[2rem] flex flex-col group relative overflow-hidden"
    >
      {/* Background Accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] opacity-10 -rotate-45 pointer-events-none transition-opacity group-hover:opacity-20 ${job.status === 'Offer' ? 'bg-emerald-500' : 'bg-brand-indigo'}`} />

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/20 transition-colors">
            <Building2 className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white group-hover:text-brand-indigo transition-colors truncate max-w-[150px]">
              {job.company_name}
            </h3>
            <p className="text-sm text-slate-400 font-medium truncate max-w-[180px]">{job.job_role}</p>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/jobs/${job.id}`)}
          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
        >
          <ArrowUpRight className="w-5 h-5" />
        </button>
      </div>

      {/* Badges & Details */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${statusStyles[job.status] || statusStyles.Applied}`}>
           {job.status}
        </span>
        {job.location && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 bg-white/5 border border-white/5">
                {job.location}
            </span>
        )}
      </div>

      {/* Meta Info */}
      <div className="space-y-3 mb-8">
         <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="w-1 h-1 rounded-full bg-slate-600" />
            <DollarSign className="w-3.5 h-3.5" />
            <span>{job.salary || 'Competitive'}</span>
         </div>
         <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="w-1 h-1 rounded-full bg-slate-600" />
            <Calendar className="w-3.5 h-3.5" />
            <span>Applied on {job.applied_date}</span>
         </div>
         <div className="flex items-center justify-between text-xs font-bold text-brand-indigo mt-4 px-3 py-2 bg-brand-indigo/5 border border-brand-indigo/10 rounded-xl">
            <div className="flex items-center gap-2">
               <Sparkles className="w-3.5 h-3.5" />
               <span>AI Match: 85%</span>
            </div>
            <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-brand-indigo w-[85%] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            </div>
         </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-auto flex items-center gap-2">
         <button 
           onClick={() => navigate(`/jobs/${job.id}`)}
           className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
         >
            <Eye className="w-4 h-4" /> Details
         </button>
         <button 
           onClick={onEdit}
           className="p-2.5 bg-brand-indigo/10 text-brand-indigo rounded-xl hover:bg-brand-indigo hover:text-white transition-all shadow-lg shadow-brand-indigo/5"
         >
            <Edit3 className="w-4 h-4" />
         </button>
         {isAdmin && (
            <button 
                onClick={onDelete}
                className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5"
            >
                <Trash2 className="w-4 h-4" />
            </button>
         )}
      </div>
    </motion.div>
  );
};

export default JobCard;
