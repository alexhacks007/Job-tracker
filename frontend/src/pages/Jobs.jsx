import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Plus, LayoutGrid, List, Briefcase, MapPin, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import JobCard from '../components/JobCard';
import JobFormModal from '../components/JobFormModal';
import Skeleton from '../components/Skeleton';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token, user } = useAuth();
  
  const categories = ['All', 'Applied', 'Interview', 'Offer', 'Rejected', 'Pending'];

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/jobs/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setJobs(await res.json());
      }
    } catch (err) {
      toast.error('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [token]);

  const handleSaveJob = async (jobData) => {
    try {
      const isEditing = !!currentJob;
      const url = isEditing 
        ? `/api/jobs/${currentJob.id}/`
        : '/api/jobs/';
      
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobData)
      });

      if (res.ok) {
        toast.success(isEditing ? 'Job updated' : 'Job added successfully');
        setIsModalOpen(false);
        fetchJobs();
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      const res = await fetch(`/api/jobs/${jobId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Job deleted');
        fetchJobs();
      }
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const filteredJobs = jobs.filter(job => {
     const matchesSearch = job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           job.job_role.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesStatus = filterStatus === 'All' || job.status === filterStatus;
     return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Job Applications</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">Manage and track your active opportunities.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
           {/* Search */}
           <div className="relative flex-1 sm:min-w-[300px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-indigo transition-colors" />
              <input 
                type="text" 
                placeholder="Search by company or role..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 glass border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-brand-indigo/20 transition-all text-sm text-white placeholder:text-slate-600"
              />
           </div>

           <div className="flex items-center gap-3">
              {/* View Switcher */}
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 shrink-0">
                 <button 
                   onClick={() => setViewMode('grid')}
                   className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-brand-indigo text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                    <LayoutGrid className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => setViewMode('list')}
                   className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-brand-indigo text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                    <List className="w-4 h-4" />
                 </button>
              </div>

              <button
                onClick={() => { setCurrentJob(null); setIsModalOpen(true); }}
                className="btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center whitespace-nowrap text-xs py-3 px-6 rounded-2xl"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add New Job
              </button>
           </div>
        </div>
      </div>

      {/* Categories / Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar w-full border-b border-white/5">
         {categories.map(cat => (
           <button
             key={cat}
             onClick={() => setFilterStatus(cat)}
             className={`px-4 sm:px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
               filterStatus === cat 
               ? 'bg-brand-indigo text-white border-brand-indigo shadow-lg shadow-brand-indigo/20' 
               : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-200'
             }`}
           >
             {cat} {cat !== 'All' && `(${jobs.filter(j => j.status === cat).length})`}
           </button>
         ))}
         <div className="ml-auto hidden sm:flex items-center gap-2 pl-4 py-2 border-l border-white/10 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-500">Filters</span>
         </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
           {[...Array(6)].map((_, i) => (
             <Skeleton key={i} className="h-64 rounded-[2.5rem]" />
           ))}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8" 
          : "space-y-4"
        }>
          <AnimatePresence mode="popLayout">
            {filteredJobs.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 flex flex-col items-center justify-center text-center glass rounded-[3rem]"
              >
                <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6">
                   <Briefcase className="w-10 h-10 text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No applications found</h3>
                <p className="text-slate-500 text-sm max-w-xs">Try adjusting your filters or search terms to find what you're looking for.</p>
                <button 
                  onClick={() => { setFilterStatus('All'); setSearchTerm(''); }}
                  className="mt-6 text-brand-indigo font-bold text-sm hover:underline"
                >
                  Clear all filters
                </button>
              </motion.div>
            ) : (
              filteredJobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job}
                  isAdmin={user?.role === 'admin' || job.user_id === user?.id}
                  onEdit={() => { setCurrentJob(job); setIsModalOpen(true); }}
                  onDelete={() => handleDelete(job.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <JobFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveJob} 
        job={currentJob} 
      />
    </div>
  );
};

export default Jobs;

