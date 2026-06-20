import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Building2, Phone, Mail, MapPin, Globe, X, Save, ArrowRight, Upload, XCircle, Briefcase, Clock, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';
import BulkUploadModal from '../components/BulkUploadModal';

const emptyCompany = { name: '', mobile: '', email: '', address: '', website: '', company_size: '', company_type: '', notes: '' };

const CompanyModal = ({ isOpen, onClose, onSave, company }) => {
  const [form, setForm] = useState(emptyCompany);

  useEffect(() => {
    setForm(company ? { ...company } : emptyCompany);
  }, [company, isOpen]);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Company name is required.');
    onSave(form);
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
          className="glass rounded-[2.5rem] w-full max-w-lg border border-white/10 overflow-hidden shadow-2xl"
        >
          <div className="flex justify-between items-center p-8 border-b border-white/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Building2 className="w-5 h-5 text-brand-indigo" />
              {company ? 'Edit Company' : 'Add New Company'}
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={22} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
              <input required type="text" name="name" value={form.name} onChange={handle}
                placeholder="e.g. Google, Stripe"
                className="w-full rounded-2xl border border-white/5 p-3.5 bg-white/5 text-white focus:ring-2 focus:ring-brand-indigo outline-none transition-all placeholder:text-slate-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Contact Phone</label>
                <input type="text" name="mobile" value={form.mobile} onChange={handle} placeholder="+91 XXXXX XXXXX"
                  className="w-full rounded-2xl border border-white/5 p-3.5 bg-white/5 text-white focus:ring-2 focus:ring-brand-indigo outline-none transition-all placeholder:text-slate-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Primary Email</label>
                <input type="email" name="email" value={form.email} onChange={handle} placeholder="hr@company.com"
                  className="w-full rounded-2xl border border-white/5 p-3.5 bg-white/5 text-white focus:ring-2 focus:ring-brand-indigo outline-none transition-all placeholder:text-slate-600" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Office Location</label>
              <input type="text" name="address" value={form.address} onChange={handle} placeholder="e.g. San Francisco, US"
                className="w-full rounded-2xl border border-white/5 p-3.5 bg-white/5 text-white focus:ring-2 focus:ring-brand-indigo outline-none transition-all placeholder:text-slate-600" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Website URL</label>
              <input type="url" name="website" value={form.website || ''} onChange={handle} placeholder="https://company.com"
                className="w-full rounded-2xl border border-white/5 p-3.5 bg-white/5 text-white focus:ring-2 focus:ring-brand-indigo outline-none transition-all placeholder:text-slate-600" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Company Size</label>
                <input list="size-options" name="company_size" value={form.company_size || ''} onChange={handle} placeholder="e.g. 50, 100-500"
                  className="w-full rounded-2xl border border-white/5 p-3.5 bg-white/5 text-white focus:ring-2 focus:ring-brand-indigo outline-none transition-all placeholder:text-slate-600" />
                <datalist id="size-options">
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </datalist>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Company Type</label>
                <input list="type-options" name="company_type" value={form.company_type || ''} onChange={handle} placeholder="e.g. Startup, MNC"
                  className="w-full rounded-2xl border border-white/5 p-3.5 bg-white/5 text-white focus:ring-2 focus:ring-brand-indigo outline-none transition-all placeholder:text-slate-600" />
                <datalist id="type-options">
                  <option value="Startup">Startup</option>
                  <option value="MNC">MNC</option>
                  <option value="Agency">Agency</option>
                  <option value="Product">Product-based</option>
                  <option value="Service">Service-based</option>
                </datalist>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Internal Notes</label>
              <textarea name="notes" value={form.notes} onChange={handle} rows="3"
                placeholder="Important contacts, culture notes, etc."
                className="w-full rounded-2xl border border-white/5 p-3.5 bg-white/5 text-white focus:ring-2 focus:ring-brand-indigo outline-none resize-none transition-all placeholder:text-slate-600" />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
              <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-400 hover:text-white rounded-2xl transition-all">Cancel</button>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save size={16} /> {company ? 'Update' : 'Save'} Details
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Companies = () => {
  const { token } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [logs, setLogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [todos, setTodos] = useState([]);
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      const [compRes, logRes, jobRes, todoRes] = await Promise.all([
        fetch('/api/companies/', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/email-logs/', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/jobs/', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/todos/', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (compRes.ok) setCompanies(await compRes.json());
      if (logRes.ok) setLogs(await logRes.json());
      if (jobRes.ok) setJobs(await jobRes.json());
      if (todoRes.ok) setTodos(await todoRes.json());
    } catch { toast.error('Failed to load companies'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchCompanies(); }, [token]);

  const handleSave = async (form) => {
    try {
      const isEdit = !!current;
      const url = isEdit ? `/api/companies/${current.id}/` : '/api/companies/';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) { toast.success(data.message); setModalOpen(false); fetchCompanies(); }
      else toast.error(data.message || 'Failed to save company');
    } catch { toast.error('Server error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this company?')) return;
    try {
      const res = await fetch(`/api/companies/${id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { toast.success(data.message); fetchCompanies(); }
      else toast.error(data.message || 'Delete failed');
    } catch { toast.error('Server error'); }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export/companies/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'organization_directory.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success('Directory exported successfully!');
      } else {
        toast.error('Failed to export directory');
      }
    } catch {
      toast.error('Server error during export');
    }
  };

  const uniqueLocations = [...new Set(companies.map(c => c.address?.split(',').pop().trim()).filter(Boolean))].sort();
  const uniqueTypes = [...new Set(companies.map(c => c.company_type).filter(Boolean))].sort();

  const filtered = companies.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                         (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
                         (c.mobile || '').includes(search);
    if (!matchesSearch) return false;

    if (locationFilter !== 'all' && !c.address?.includes(locationFilter)) return false;
    if (sizeFilter !== 'all') {
      const size = c.company_size || '';
      if (size === sizeFilter) {
        // Direct match
      } else {
        const parseRange = (s) => {
          if (!s) return null;
          const match = s.match(/(\d+)\s*[-–]\s*(\d+)/);
          if (match) return [parseInt(match[1]), parseInt(match[2])];
          const plusMatch = s.match(/(\d+)\+/);
          if (plusMatch) return [parseInt(plusMatch[1]), 1000000];
          const singleMatch = s.match(/(\d+)/);
          if (singleMatch) return [parseInt(singleMatch[1]), parseInt(singleMatch[1])];
          return null;
        };

        const filterRange = parseRange(sizeFilter);
        const companyRange = parseRange(size);

        if (filterRange && companyRange) {
           const [fMin, fMax] = filterRange;
           const [cMin, cMax] = companyRange;
           // Overlap check
           if (!(cMax >= fMin && cMin <= fMax)) return false;
        } else {
           return false;
        }
      }
    }
    if (typeFilter !== 'all' && c.company_type !== typeFilter) return false;
    
    if (historyFilter !== 'all') {
      const companyLogs = logs.filter(l => l.company === c.id && l.status === 'Sent');
      const lastContact = companyLogs.length > 0 
        ? new Date(Math.max(...companyLogs.map(l => new Date(l.sent_at || l.created_at))))
        : null;
      
      const now = new Date();
      const diffDays = lastContact ? Math.floor((now - lastContact) / (1000 * 60 * 60 * 24)) : null;

      if (historyFilter === 'never' && companyLogs.length > 0) return false;
      if (historyFilter === '7days' && (diffDays === null || diffDays > 7)) return false;
      if (historyFilter === '7plus' && (diffDays === null || diffDays <= 7)) return false;
      if (historyFilter === '30days' && (diffDays === null || diffDays > 30)) return false;
      if (historyFilter === 'old' && (diffDays === null || diffDays <= 30)) return false;
    }

    return true;
  });

  const totalEmailsSent = logs.filter(l => l.status === 'Sent').length;
  const companiesReached = [...new Set(logs.filter(l => l.status === 'Sent').map(l => l.company))].length;

  return (
    <div className="space-y-8 pb-12">
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-brand-indigo/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500" />
             <div className="relative">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Companies</p>
                <h3 className="text-3xl font-black text-white">{companies.length}</h3>
             </div>
          </div>
          <div className="glass p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500" />
             <div className="relative">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Outreach</p>
                <h3 className="text-3xl font-black text-emerald-400">{totalEmailsSent}</h3>
             </div>
          </div>
          <div className="glass p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-brand-violet/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500" />
             <div className="relative">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Companies Reached</p>
                <h3 className="text-3xl font-black text-brand-violet">{companiesReached}</h3>
             </div>
          </div>
          <div className="glass p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-500" />
             <div className="relative">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Response Pending</p>
                <h3 className="text-3xl font-black text-amber-400">{companies.length - companiesReached}</h3>
             </div>
          </div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Organization Directory</h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">Keep track of key players and contacts.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <button onClick={() => { setCurrent(null); setModalOpen(true); }}
                className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 whitespace-nowrap text-xs py-3 px-5 rounded-2xl">
                <Plus size={16} /> Add Company
              </button>
              <button onClick={() => setIsBulkModalOpen(true)}
                className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 whitespace-nowrap text-xs py-3 px-5 rounded-2xl bg-brand-indigo/10 text-brand-indigo hover:bg-brand-indigo/20 border border-brand-indigo/30">
                <Upload size={16} /> Bulk Upload
              </button>
              <button onClick={handleExport}
                className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 whitespace-nowrap text-xs py-3 px-5 rounded-2xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30">
                <Download size={16} /> Export Excel
              </button>
          </div>
        </div>

        {/* Advance Filters */}
        <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/5 flex flex-col xl:flex-row gap-4 items-stretch xl:items-center">
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-indigo transition-colors" />
              <input type="text" placeholder="Search by name, site, or contact..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-brand-indigo/20 transition-all text-sm text-white placeholder:text-slate-600" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:flex xl:flex-row gap-2.5 sm:gap-3 w-full xl:w-auto">
               <select value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="w-full xl:w-auto bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:ring-2 focus:ring-brand-indigo/20 outline-none min-w-[120px]">
                  <option value="all">All Locations</option>
                  {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
               </select>

               <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)} className="w-full xl:w-auto bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:ring-2 focus:ring-brand-indigo/20 outline-none min-w-[120px]">
                  <option value="all">All Sizes</option>
                  <option value="1-10">1-10 emp</option>
                  <option value="11-50">11-50 emp</option>
                  <option value="51-200">51-200 emp</option>
                  <option value="201-500">201-500 emp</option>
                  <option value="500+">500+ emp</option>
               </select>

               <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-full xl:w-auto bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:ring-2 focus:ring-brand-indigo/20 outline-none min-w-[120px]">
                  <option value="all">All Types</option>
                  {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
               </select>

               <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} className="w-full xl:w-auto bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs sm:text-sm text-white focus:ring-2 focus:ring-brand-indigo/20 outline-none min-w-[120px]">
                  <option value="all">Any History</option>
                  <option value="never">Never Contacted</option>
                  <option value="7days">Contacted (7d)</option>
                  <option value="7plus">Contacted (7d+)</option>
                  <option value="30days">Contacted (30d)</option>
                  <option value="old">Contacted (30d+)</option>
               </select>

               <button onClick={() => { setSearch(''); setLocationFilter('all'); setSizeFilter('all'); setTypeFilter('all'); setHistoryFilter('all'); }} className="col-span-2 xl:col-span-1 py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors text-center whitespace-nowrap">Reset Filters</button>
            </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
           {[...Array(6)].map((_, i) => (
             <Skeleton key={i} className="h-64 rounded-[2.5rem]" />
           ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-[2rem] sm:rounded-[3rem] p-12 sm:p-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6">
             <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-slate-700" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No companies found</h3>
          <p className="text-slate-500 text-sm max-w-xs">Start building your network by adding your first company profile.</p>
          <button onClick={() => setModalOpen(true)} className="mt-6 sm:mt-8 text-brand-indigo font-bold hover:underline flex items-center gap-2">
             Add now <ArrowRight size={16} />
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 sm:gap-8">
          <AnimatePresence mode="popLayout">
            {filtered.map((c, i) => (
              <motion.div 
                key={c.id} 
                layout
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setSelectedCompany(c)}
                className="glass p-6 rounded-[2.5rem] border border-white/5 hover:border-brand-indigo/30 transition-all group relative overflow-hidden cursor-pointer shadow-2xl hover:shadow-brand-indigo/5 transition-all"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 bg-brand-indigo transition-opacity group-hover:opacity-20 pointer-events-none" />

                {/* Card Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-indigo to-brand-violet flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-brand-indigo/20">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white group-hover:text-brand-indigo transition-colors">{c.name}</h3>
                      {c.address && <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-2"><MapPin size={12} className="text-slate-600" />{c.address}</p>}
                      <div className="flex gap-2 mt-2">
                        {c.company_size && <span className="text-[10px] bg-brand-indigo/10 text-brand-indigo px-2 py-0.5 rounded-full font-bold">{c.company_size} emp</span>}
                        {c.company_type && <span className="text-[10px] bg-brand-violet/10 text-brand-violet px-2 py-0.5 rounded-full font-bold">{c.company_type}</span>}
                      </div>
                    </div>
                  </div>
                  {/* Email Count Badge */}
                  {(() => {
                    const count = logs.filter(l => l.company === c.id && l.status === 'Sent').length;
                    return count > 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                        <Mail size={10} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase">{count} Emails</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Contact Details */}
                <div className="space-y-4 mb-8">
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noopener noreferrer" 
                       onClick={(e) => e.stopPropagation()}
                       className="flex items-center justify-between group/link p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-indigo/30 transition-all">
                       <div className="flex items-center gap-3">
                         <Globe size={16} className="text-brand-indigo" />
                         <span className="text-sm font-medium text-slate-300 group-hover/link:text-white transition-colors">{c.website.replace(/^https?:\/\//, '')}</span>
                       </div>
                       <ArrowRight size={14} className="text-slate-600 group-hover/link:text-brand-indigo transition-all" />
                    </a>
                  )}
                  
                  <div className="flex gap-3">
                    {c.email && (
                      <a href={`mailto:${c.email}`} 
                         onClick={(e) => e.stopPropagation()}
                         className="flex-1 p-3 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 transition-all">
                         <Mail size={16} className="text-slate-500" />
                         <span className="text-xs font-bold text-slate-300">Email</span>
                      </a>
                    )}
                    {c.mobile && (
                      <a href={`tel:${c.mobile}`} 
                         onClick={(e) => e.stopPropagation()}
                         className="flex-1 p-3 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 transition-all">
                         <Phone size={16} className="text-slate-500" />
                         <span className="text-xs font-bold text-slate-300">Call</span>
                      </a>
                    )}
                  </div>
                </div>

                 {/* Footer */}
                 <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                    <div>
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Since {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
                       {(() => {
                          const companyLogs = logs.filter(l => l.company === c.id && l.status === 'Sent');
                          const lastContact = companyLogs.length > 0 
                            ? new Date(Math.max(...companyLogs.map(l => new Date(l.sent_at || l.created_at))))
                            : null;
                          return lastContact && (
                             <p className="text-[10px] text-brand-indigo font-bold mt-1 uppercase tracking-tighter">Last Contact: {lastContact.toLocaleDateString()}</p>
                          );
                       })()}
                    </div>
                    <div className="flex gap-1">
                       <button onClick={(e) => { e.stopPropagation(); setCurrent(c); setModalOpen(true); }} className="p-2 text-slate-500 hover:text-brand-indigo hover:bg-brand-indigo/10 rounded-xl transition-all"><Edit2 size={16} /></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </div>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <CompanyModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} company={current} />
      {isBulkModalOpen && (
         <BulkUploadModal onClose={() => setIsBulkModalOpen(false)} onSuccess={fetchCompanies} />
      )}

      {/* Company History Timeline Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setSelectedCompany(null)}
             className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
             className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl overflow-hidden">
             <div className="p-5 sm:p-8">
                <div className="flex justify-between items-start mb-6 md:mb-8 gap-4">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-indigo/20 flex items-center justify-center text-brand-indigo font-black text-lg sm:text-xl shrink-0">
                         {selectedCompany.name.charAt(0)}
                      </div>
                      <div>
                         <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">{selectedCompany.name}</h2>
                         <p className="text-slate-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5">Interaction Timeline</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedCompany(null)} className="p-1.5 hover:bg-white/5 rounded-full text-slate-400 transition-colors shrink-0">
                      <XCircle size={20} className="sm:w-6 sm:h-6" />
                   </button>
                </div>

                <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
                   {(() => {
                      const events = [
                        ...logs.filter(l => l.company === selectedCompany.id).map(l => ({
                           type: 'email',
                           date: l.sent_at || l.created_at,
                           status: l.status,
                           subject: l.recipient_email,
                           label: 'Email Sent'
                        })),
                        ...jobs.filter(j => j.company_name === selectedCompany.name).map(j => ({
                           type: 'job',
                           date: j.applied_date || j.created_at,
                           status: j.status,
                           subject: j.job_role,
                           label: 'Job Applied'
                        })),
                        ...todos.filter(t => t.company_id === selectedCompany.id || t.company_name === selectedCompany.name).map(t => ({
                           type: 'todo',
                           date: t.created_at,
                           status: t.status,
                           subject: t.title,
                           label: 'Task Created'
                        }))
                      ].sort((a, b) => new Date(b.date) - new Date(a.date));

                      if (events.length === 0) return <div className="text-center py-20 text-slate-600 font-medium italic">No interaction history found for this organization.</div>;

                      return events.map((ev, idx) => (
                        <div key={idx} className="relative pl-8 group">
                           {/* Vertical Line */}
                           {idx !== events.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-white/5" />}
                           
                           {/* Icon Dot */}
                           <div className={`absolute left-0 top-1 w-6 h-6 rounded-lg flex items-center justify-center z-10 ${
                              ev.type === 'email' ? 'bg-emerald-500/20 text-emerald-500' : 
                              ev.type === 'job' ? 'bg-brand-indigo/20 text-brand-indigo' : 
                              'bg-amber-500/20 text-amber-500'
                           }`}>
                              {ev.type === 'email' ? <Mail size={12} /> : ev.type === 'job' ? <Briefcase size={12} /> : <CheckCircle size={12} />}
                           </div>

                           <div className="bg-white/5 border border-white/5 rounded-2xl p-4 group-hover:border-white/10 transition-all">
                              <div className="flex justify-between items-start mb-1">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{ev.label}</p>
                                 <p className="text-[10px] font-bold text-slate-600 italic">{new Date(ev.date).toLocaleString()}</p>
                              </div>
                              <h4 className="text-sm font-bold text-white mb-1">{ev.subject}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                 ev.status === 'Sent' || ev.status === 'Applied' || ev.status === 'completed' ? 'text-emerald-500' : 
                                 ev.status === 'Invalid' ? 'text-amber-500' :
                                 'text-slate-500'
                              }`}>
                                 {ev.status}
                              </span>
                           </div>
                        </div>
                      ));
                   })()}
                </div>
             </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default Companies;

