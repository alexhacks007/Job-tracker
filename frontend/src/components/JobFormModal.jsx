import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, ChevronDown, Save, Calendar, MapPin, DollarSign, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ALL_STATUSES = [
  { value: 'Applied',        label: 'Applied',                   desc: 'Application submitted' },
  { value: 'Pending',        label: 'Pending',                   desc: 'Waiting for response' },
  { value: 'Called',         label: 'Called',                    desc: 'Followed up via call' },
  { value: 'Interview',      label: 'Interview',                 desc: 'Scheduled session' },
  { value: 'Offer',          label: 'Offer',                     desc: 'Received proposal' },
  { value: 'Rejected',       label: 'Rejected',                  desc: 'Not selected' },
];

const inpBase = "w-full rounded-2xl border border-white/5 p-3.5 bg-white/5 text-sm text-white focus:ring-2 focus:ring-brand-indigo outline-none transition-all placeholder:text-slate-600";
const lblBase = "text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block";

const JobFormModal = ({ isOpen, onClose, onSave, job }) => {
  const { token } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '', job_role: '', location: '', salary: '',
    status: 'Applied', platform: '',
    applied_date: new Date().toISOString().split('T')[0],
    interview_date: '', interview_result: '', notes: ''
  });

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/companies/', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(data => setCompanies(Array.isArray(data) ? data : [])).catch(() => {});

    if (job) {
      setFormData(job);
      setCompanySearch(job.company_name || '');
    } else {
      setFormData({ company_name: '', job_role: '', location: '', salary: '', status: 'Applied', platform: '', applied_date: new Date().toISOString().split('T')[0], interview_date: '', interview_result: '', notes: '' });
      setCompanySearch('');
    }
  }, [job, isOpen, token]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const selectCompany = (c) => {
    setFormData({ ...formData, company_name: c.name, location: c.address || formData.location });
    setCompanySearch(c.name);
    setShowDropdown(false);
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }} 
          animate={{ y: 0, opacity: 1, scale: 1 }} 
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          className="glass rounded-[3rem] w-full max-w-2xl border border-white/10 overflow-hidden shadow-2xl"
        >
          <div className="flex justify-between items-center p-8 border-b border-white/5">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                  <Building2 size={24} />
               </div>
               {job ? 'Modify Entry' : 'New Application'}
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Company picker */}
               <div className="relative">
                 <label className={lblBase}>Company</label>
                 <div className="relative">
                   <input
                     required type="text" placeholder="Search or type..." value={companySearch}
                     onChange={(e) => {
                       setCompanySearch(e.target.value);
                       setFormData({ ...formData, company_name: e.target.value });
                       setShowDropdown(true);
                     }}
                     onFocus={() => setShowDropdown(true)}
                     onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
                     className={inpBase}
                   />
                   <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                 </div>

                 {/* Dropdown suggestions */}
                 {showDropdown && filteredCompanies.length > 0 && (
                   <div className="absolute z-20 w-full mt-2 glass rounded-2xl border border-white/10 shadow-2xl max-h-48 overflow-y-auto no-scrollbar">
                     {filteredCompanies.map(c => (
                       <button key={c.id} type="button" onMouseDown={() => selectCompany(c)}
                         className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-4">
                         <div className="w-8 h-8 rounded-lg bg-brand-indigo/20 flex items-center justify-center text-brand-indigo text-xs font-bold">
                           {c.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                           <p className="text-sm font-bold text-white">{c.name}</p>
                           {c.address && <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{c.address}</p>}
                         </div>
                       </button>
                     ))}
                   </div>
                 )}
               </div>

               {/* Role */}
               <div>
                 <label className={lblBase}>Job Position</label>
                 <input required type="text" name="job_role" value={formData.job_role} onChange={handleChange} placeholder="e.g. Lead Designer" className={inpBase} />
               </div>
            </div>

            {/* Applied Platform */}
            <div>
              <label className={lblBase}>Sourcing Channel</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'LinkedIn',  label: 'LinkedIn' },
                  { value: 'Naukri',   label: 'Naukri' },
                  { value: 'Indeed',   label: 'Indeed' },
                  { value: 'Direct',   label: 'Direct' },
                  { value: 'Referral', label: 'Referral' },
                  { value: 'Other',    label: 'Other' },
                ].map(p => {
                  const sel = formData.platform === p.value;
                  return (
                    <button
                      key={p.value} type="button" onClick={() => setFormData({ ...formData, platform: sel ? '' : p.value })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all
                        ${sel ? 'bg-brand-indigo border-brand-indigo text-white shadow-lg' : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'}`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={lblBase}><MapPin size={12} className="inline mr-1" />Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Remote / City" className={inpBase} />
              </div>
              <div>
                <label className={lblBase}><DollarSign size={12} className="inline mr-1" />Salary</label>
                <input type="text" name="salary" value={formData.salary} onChange={handleChange} placeholder="e.g. $120k" className={inpBase} />
              </div>
              <div>
                <label className={lblBase}><Calendar size={12} className="inline mr-1" />Date Applied</label>
                <input type="date" name="applied_date" value={formData.applied_date} onChange={handleChange} className={inpBase} />
              </div>
            </div>

            {/* Status Grid */}
            <div>
              <label className={lblBase}>Current Status</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALL_STATUSES.map(s => (
                  <button
                    key={s.value} type="button" onClick={() => setFormData({ ...formData, status: s.value })}
                    className={`flex flex-col text-left p-4 rounded-2xl border transition-all
                      ${formData.status === s.value
                        ? 'bg-brand-indigo/10 border-brand-indigo text-brand-indigo'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'}`}
                  >
                    <span className="font-bold text-sm">{s.label}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 mt-1">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note Area */}
            <div>
              <label className={lblBase}>Notes & Insights</label>
              <textarea name="notes" value={formData.notes || ''} onChange={handleChange} rows="3"
                placeholder="Key requirements, glassdoor insights, etc."
                className={`${inpBase} resize-none`} />
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t border-white/5">
              <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-500 hover:text-white transition-all font-bold">Cancel</button>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save size={18} /> {job ? 'Update' : 'Save'} Application
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default JobFormModal;

