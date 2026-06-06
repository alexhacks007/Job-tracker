import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Send, Users, Mail, Activity, Plus, Play, RefreshCw, Archive, CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const EmailCampaigns = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingEmails, setVerifyingEmails] = useState({}); // { email: { status, reason } }
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '', resume: null });
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  const AVAILABLE_VARIABLES = [
    { label: 'Company Name', tag: '{{company_name}}' },
    { label: 'Location', tag: '{{company_location}}' },
    { label: 'Website', tag: '{{company_website}}' }
  ];

  const insertVariable = (field, tag) => {
    setNewTemplate(prev => ({
      ...prev,
      [field]: prev[field] + tag
    }));
  };
  const [newCampaign, setNewCampaign] = useState({ name: '', template: '', selectedCompanies: [] });

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');

  const [logSearch, setLogSearch] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('all');
  const [logDateFilter, setLogDateFilter] = useState('all');
  const [logLocationFilter, setLogLocationFilter] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tplRes, cmpRes, compRes, logRes] = await Promise.all([
        fetch('/api/email-templates/', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/email-campaigns/', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/companies/', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/email-logs/', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (tplRes.ok) setTemplates(await tplRes.json());
      if (cmpRes.ok) setCampaigns(await cmpRes.json());
      if (compRes.ok) setCompanies(await compRes.json());
      if (logRes.ok) setLogs(await logRes.json());
    } catch (err) {
      toast.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      const url = editingTemplateId ? `/api/email-templates/${editingTemplateId}/` : '/api/email-templates/';
      
      // We use PATCH for editing if we might not want to re-upload the same file, 
      // but let's just stick to PUT for consistency if that's what we used before.
      // However, FormData with PUT can be tricky in some DRF versions. 
      // Let's use POST for create and PATCH for edit if possible, 
      // but I'll stick to the current logic and just use FormData.
      const method = editingTemplateId ? 'PATCH' : 'POST';
      
      const formData = new FormData();
      formData.append('name', newTemplate.name);
      formData.append('subject', newTemplate.subject);
      formData.append('body', newTemplate.body);
      if (newTemplate.resume instanceof File) {
        formData.append('resume', newTemplate.resume);
      }

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        toast.success(`Template ${editingTemplateId ? 'updated' : 'created'} successfully`);
        setNewTemplate({ name: '', subject: '', body: '', resume: null });
        setEditingTemplateId(null);
        fetchData();
      }
    } catch (err) {
      toast.error(`Failed to ${editingTemplateId ? 'update' : 'create'} template`);
    }
  };

  const handleEditClick = (t) => {
    setNewTemplate({ name: t.name, subject: t.subject, body: t.body, resume: null });
    setEditingTemplateId(t.id);
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await fetch(`/api/email-templates/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Template deleted");
        if (editingTemplateId === id) {
           setNewTemplate({ name: '', subject: '', body: '' });
           setEditingTemplateId(null);
        }
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to delete template");
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    // Advanced Validation Check: Mandatory Deep Scan
    toast.loading("Performing deep deliverability scan...", { id: 'verify-scan' });
    const selectedCompaniesData = companies.filter(c => newCampaign.selectedCompanies.includes(c.id));
    let hasInvalid = false;
    const newVerifications = { ...verifyingEmails };

    for (const comp of selectedCompaniesData) {
      if (!newVerifications[comp.email] || newVerifications[comp.email].status === 'unknown') {
        try {
          const vRes = await fetch('/api/auth/verify-email/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ email: comp.email })
          });
          if (vRes.ok) {
            const result = await vRes.json();
            newVerifications[comp.email] = result;
            if (result.status === 'invalid') hasInvalid = true;
          }
        } catch (err) {
           console.error("Verification error", err);
        }
      } else if (newVerifications[comp.email].status === 'invalid') {
        hasInvalid = true;
      }
    }

    setVerifyingEmails(newVerifications);
    toast.dismiss('verify-scan');

    const validCompanies = selectedCompaniesData.filter(c => newVerifications[c.email]?.status !== 'invalid');
    const invalidCount = selectedCompaniesData.length - validCompanies.length;

    if (validCompanies.length === 0) {
      toast.error("Launch Blocked: All selected contacts failed identification. Please fix the addresses before proceeding.");
      return;
    }

    if (invalidCount > 0) {
      toast.success(`Smart Guard: Proceeding with ${validCompanies.length} valid contacts. ${invalidCount} invalid addresses were automatically skipped.`);
    }

    try {
      // Create campaign
      const res = await fetch('/api/email-campaigns/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCampaign.name, template: newCampaign.template })
      });
      
      if (res.ok) {
        const campaignData = await res.json();
        
        // Trigger bulk send with ALL selected company IDs
        // The backend 'Smart Firewall' will safely skip the invalid ones and update the counts
        const sendRes = await fetch(`/api/email-campaigns/${campaignData.id}/send_bulk/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ company_ids: newCampaign.selectedCompanies })
        });

        if (sendRes.ok) {
           toast.success('Campaign launched in background!');
           setNewCampaign({ name: '', template: '', selectedCompanies: [] });
           fetchData();
        }
      }
    } catch (err) {
      toast.error('Failed to launch campaign');
    }
  };

  const toggleCompanySelection = (id) => {
    setNewCampaign(prev => ({
      ...prev,
      selectedCompanies: prev.selectedCompanies.includes(id)
        ? prev.selectedCompanies.filter(cid => cid !== id)
        : [...prev.selectedCompanies, id]
    }));
  };

  const handleVerifyEmail = async (e, email) => {
    e.stopPropagation();
    if (!email) return;
    setVerifyingEmails(prev => ({ ...prev, [email]: { status: 'loading' } }));
    try {
      const res = await fetch('/api/auth/verify-email/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const result = await res.json();
        setVerifyingEmails(prev => ({ ...prev, [email]: result }));
        if (result.status === 'valid') toast.success(`Validated: ${email}`);
        else if (result.status === 'risky') toast.warn(`Risky: ${result.reason}`);
        else toast.error(`Invalid: ${result.reason}`);
      }
    } catch {
      toast.error('Verification failed');
      setVerifyingEmails(prev => ({ ...prev, [email]: { status: 'unknown', reason: 'Service unavailable' } }));
    }
  };

  const handleMarkInvalid = async (companyId) => {
    try {
      const res = await fetch(`/api/companies/${companyId}/mark_invalid/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Email marked as permanently invalid");
        fetchData();
      }
    } catch {
      toast.error("Failed to mark email as invalid");
    }
  };

  const uniqueLocations = [...new Set(companies.map(c => c.address?.split(',').pop().trim()).filter(Boolean))].sort();

  const companyLastContact = {};
  logs.forEach(log => {
    if (log.sent_at) {
      const d = new Date(log.sent_at);
      if (!companyLastContact[log.company] || d > companyLastContact[log.company]) {
        companyLastContact[log.company] = d;
      }
    }
  });

  const getFilteredCompanies = () => {
    return companies.filter(c => c.email).filter(c => {
      const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.email?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      
      if (locationFilter && !c.address?.includes(locationFilter)) return false;
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
             if (!(cMax >= fMin && cMin <= fMax)) return false;
          } else {
             return false;
          }
        }
      }
      if (typeFilter !== 'all' && c.company_type !== typeFilter) return false;
      
      const lastContact = companyLastContact[c.id];
      if (historyFilter === 'never_contacted') {
         if (lastContact) return false;
      } else if (historyFilter !== 'all') {
         if (!lastContact) return false;
         const daysSince = (new Date() - lastContact) / (1000 * 60 * 60 * 24);
         if (historyFilter === 'contacted_7_days' && daysSince > 7) return false;
         if (historyFilter === 'contacted_7_plus' && daysSince <= 7) return false;
         if (historyFilter === 'contacted_30_days' && daysSince > 30) return false;
         if (historyFilter === 'contacted_older' && daysSince <= 30) return false;
      }
      return true;
    });
  };

  const filteredCompanies = getFilteredCompanies();
  const allFilteredSelected = filteredCompanies.length > 0 && filteredCompanies.every(c => newCampaign.selectedCompanies.includes(c.id));

  const handleSelectAll = (e) => {
    e.preventDefault();
    const allFilteredIds = filteredCompanies.map(c => c.id);
    if (allFilteredSelected) {
       setNewCampaign(prev => ({
         ...prev,
         selectedCompanies: prev.selectedCompanies.filter(id => !allFilteredIds.includes(id))
       }));
    } else {
       setNewCampaign(prev => ({
         ...prev,
         selectedCompanies: [...new Set([...prev.selectedCompanies, ...allFilteredIds])]
       }));
    }
  };

  const uniqueLogLocations = [...new Set(logs.map(l => l.company_location?.split(',').pop().trim()).filter(Boolean))].sort();

  const getFilteredLogs = () => {
    return logs.filter(log => {
      const searchLower = logSearch.toLowerCase();
      const matchesSearch = log.company_name?.toLowerCase().includes(searchLower) ||
                            log.recipient_email?.toLowerCase().includes(searchLower) ||
                            log.template_name?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;

      if (logStatusFilter !== 'all' && log.status !== logStatusFilter) return false;
      if (logLocationFilter && !log.company_location?.includes(logLocationFilter)) return false;

      if (logDateFilter !== 'all' && log.sent_at) {
        const daysSince = (new Date() - new Date(log.sent_at)) / (1000 * 60 * 60 * 24);
        if (logDateFilter === 'today' && daysSince > 1) return false;
        if (logDateFilter === 'last_7_days' && daysSince > 7) return false;
        if (logDateFilter === 'last_30_days' && daysSince > 30) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.sent_at || 0) - new Date(a.sent_at || 0));
  };

  const filteredLogs = getFilteredLogs();

  if (loading) return (
    <div className="flex items-center justify-center p-12"><div className="w-12 h-12 border-4 border-brand-indigo border-t-transparent rounded-full animate-spin"></div></div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Mail className="text-brand-indigo" size={36} /> Bulk Outreach Platform
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Automate, personalize, and track your job applications</p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl overflow-x-auto w-max">
        {[
          { id: 'campaigns', label: 'Campaigns Dashboard', icon: Activity },
          { id: 'templates', label: 'Email Templates', icon: Archive },
          { id: 'history', label: 'Send History', icon: Send }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-brand-indigo text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setSelectedCampaign(null)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <h2 className="text-2xl font-bold text-white">{selectedCampaign.name}</h2>
                     <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Clock size={12} /> {new Date(selectedCampaign.created_at).toLocaleString()}</p>
                        <p className="text-slate-400 text-xs flex items-center gap-1"><Mail size={12} /> {templates.find(t => t.id === selectedCampaign.template)?.name || 'Custom'}</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedCampaign(null)} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
                     <XCircle size={24} />
                  </button>
               </div>

               <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                     <p className="text-2xl font-black text-emerald-400">{selectedCampaign.total_sent}</p>
                     <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Sent</p>
                  </div>
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
                     <p className="text-2xl font-black text-rose-400">{selectedCampaign.total_failed}</p>
                     <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Failed</p>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-center">
                     <p className="text-2xl font-black text-amber-500">{selectedCampaign.total_invalid || 0}</p>
                     <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Invalid</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                     <p className="text-2xl font-black text-white">{selectedCampaign.total_sent + selectedCampaign.total_failed + (selectedCampaign.total_invalid || 0)}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                  </div>
               </div>

               <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                  {logs.filter(l => l.campaign === selectedCampaign.id).length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No logs found for this campaign.</div>
                  ) : (
                    logs.filter(l => l.campaign === selectedCampaign.id).map(log => (
                      <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                         <div>
                            <p className="font-bold text-white text-sm">{log.company_name}</p>
                            <p className="text-xs text-slate-500">{log.recipient_email}</p>
                         </div>
                         <div className="flex flex-col items-end gap-1">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                               log.status === 'Sent' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                               log.status === 'Failed' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                               'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                               {log.status}
                            </span>
                            {log.error_message && <p className="text-[10px] text-rose-400 max-w-[150px] truncate" title={log.error_message}>{log.error_message}</p>}
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
             <div className="glass-card p-6 border-t-4 border-emerald-500">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Play className="text-emerald-500"/> Launch Campaign</h3>
                <form onSubmit={handleCreateCampaign} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Campaign Name</label>
                    <input required type="text" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-brand-indigo outline-none" value={newCampaign.name} onChange={e => setNewCampaign({...newCampaign, name: e.target.value})} placeholder="e.g. Q3 Startup Outreach" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Select Template</label>
                    <select required className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-brand-indigo outline-none" value={newCampaign.template} onChange={e => setNewCampaign({...newCampaign, template: e.target.value})}>
                       <option value="">-- Choose Template --</option>
                       {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2 flex justify-between items-center">
                       <span>Target Companies</span>
                       <span className="text-emerald-500 font-bold">{newCampaign.selectedCompanies.length} selected</span>
                    </label>
                    
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-3 mb-2 space-y-3">
                       <input type="text" className="w-full bg-black/20 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-brand-indigo outline-none" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                       
                       <div className="grid grid-cols-2 gap-2">
                         <select className="bg-black/20 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-brand-indigo outline-none" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                            <option value="">All Locations</option>
                            {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                         </select>

                         <select className="bg-black/20 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-brand-indigo outline-none" value={sizeFilter} onChange={e => setSizeFilter(e.target.value)}>
                            <option value="all">All Sizes</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="500+">500+ employees</option>
                         </select>

                         <select className="bg-black/20 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-brand-indigo outline-none" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                            <option value="all">All Types</option>
                            <option value="Startup">Startup</option>
                            <option value="MNC">MNC</option>
                            <option value="Agency">Agency</option>
                            <option value="Product">Product-based</option>
                            <option value="Service">Service-based</option>
                         </select>
                         
                         <select className="bg-black/20 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-brand-indigo outline-none" value={historyFilter} onChange={e => setHistoryFilter(e.target.value)}>
                             <option value="all">Any History</option>
                             <option value="never_contacted">Never Contacted</option>
                             <option value="contacted_7_days">Contacted (Last 7 Days)</option>
                             <option value="contacted_7_plus">Contacted (7+ Days Ago)</option>
                             <option value="contacted_30_days">Contacted (Last 30 Days)</option>
                             <option value="contacted_older">Contacted (30+ Days Ago)</option>
                         </select>
                       </div>
                       
                       <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                         <span className="text-xs text-slate-400">Showing {filteredCompanies.length} companies</span>
                         <button onClick={handleSelectAll} className="text-xs font-bold text-brand-indigo hover:text-white transition-colors">
                            {allFilteredSelected ? 'Deselect All Filtered' : 'Select All Filtered'}
                         </button>
                       </div>
                    </div>

                    <div className="h-56 overflow-y-auto bg-slate-900/50 border border-slate-700 rounded-xl p-2 space-y-1">
                       {filteredCompanies.map(c => {
                         const lastContact = companyLastContact[c.id];
                         return (
                           <div key={c.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors" onClick={() => toggleCompanySelection(c.id)}>
                             <input type="checkbox" checked={newCampaign.selectedCompanies.includes(c.id)} readOnly className="accent-emerald-500 w-4 h-4" />
                             <div className="flex-1">
                               <p className="text-sm text-white font-medium flex justify-between">
                                  {c.name}
                                  {lastContact && <span className="text-[10px] text-slate-500 font-mono">Last: {lastContact.toLocaleDateString()}</span>}
                               </p>
                               <div className="flex justify-between items-center">
                                 <p className="text-xs text-slate-400 flex items-center gap-1">
                                   {c.email}
                                   {(() => {
                                      const verification = verifyingEmails[c.email];
                                      if (verification?.status === 'loading') return <RefreshCw size={10} className="animate-spin text-brand-indigo" />;
                                      if (verification?.status === 'valid') return <CheckCircle size={10} className="text-emerald-500" title="MX Records Verified" />;
                                      if (verification?.status === 'invalid') return <XCircle size={10} className="text-rose-500" title={verification.reason} />;
                                      if (verification?.status === 'risky') return <AlertTriangle size={10} className="text-amber-500" title={verification.reason} />;
                                      
                                      const isSyntaxValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email);
                                      return (
                                        <button 
                                          onClick={(e) => handleVerifyEmail(e, c.email)}
                                          className={`p-0.5 rounded hover:bg-white/10 transition-colors ${!isSyntaxValid ? 'text-rose-500' : 'text-slate-500 hover:text-brand-indigo'}`}
                                          title={!isSyntaxValid ? "Malformed Syntax - Click to re-verify" : "Click to verify deliverability (MX Check)"}
                                        >
                                          <ShieldCheck size={12} />
                                        </button>
                                      );
                                   })()}
                                 </p>
                                 <div className="flex gap-1">
                                    {c.company_size && <p className="text-[10px] text-brand-indigo bg-brand-indigo/10 px-1.5 py-0.5 rounded">{c.company_size}</p>}
                                    <p className="text-[10px] text-slate-500 bg-black/30 px-1.5 py-0.5 rounded">{c.address || 'Remote'}</p>
                                 </div>
                               </div>
                             </div>
                           </div>
                         );
                       })}

                       {filteredCompanies.length === 0 && <p className="text-xs text-slate-500 text-center p-4">No companies match filters.</p>}
                    </div>
                  </div>
                  <button type="submit" className="w-full btn-primary bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 py-3 rounded-xl flex justify-center items-center gap-2">
                     <Send size={18} /> Launch Background Sequence
                  </button>
                </form>
             </div>
          </div>
          <div className="lg:col-span-2 glass-card p-6">
             <h3 className="text-xl font-bold text-white mb-6">Active & Past Campaigns</h3>
             <div className="space-y-4">
                {campaigns.length === 0 ? (
                  <div className="text-center p-12 border border-dashed border-slate-700 rounded-2xl"><p className="text-slate-400">No campaigns launched yet.</p></div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {campaigns.map(c => (
                      <div key={c.id} onClick={() => setSelectedCampaign(c)} className="glass p-6 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-brand-indigo/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-6">
                          <div>
                            <h4 className="text-lg font-bold text-white">{c.name}</h4>
                            <p className="text-sm text-slate-400">Started on {new Date(c.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-center">
                              <p className="text-2xl font-black text-emerald-400">{c.total_sent}</p>
                              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Sent</p>
                           </div>
                           <div className="text-center">
                              <p className="text-2xl font-black text-red-400">{c.total_failed}</p>
                              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Failed</p>
                           </div>
                           <div className="text-center">
                              <p className="text-2xl font-black text-amber-500">{c.total_invalid || 0}</p>
                              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Invalid</p>
                           </div>
                           <div className="text-center">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${c.status === 'Running' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : c.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                                {c.status}
                              </span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'templates' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                <span>{editingTemplateId ? 'Edit Template' : 'Create Template'}</span>
                {editingTemplateId && (
                  <button type="button" onClick={() => { setEditingTemplateId(null); setNewTemplate({ name: '', subject: '', body: '' }); }} className="text-xs text-slate-400 hover:text-white px-3 py-1 bg-white/5 rounded-lg">Cancel Edit</button>
                )}
              </h3>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Template Name</label>
                    <input required type="text" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-brand-indigo outline-none" value={newTemplate.name} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} placeholder="e.g. Standard Developer Pitch" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1 flex justify-between items-center">
                       <span>Email Subject</span>
                       <div className="flex gap-1">
                          {AVAILABLE_VARIABLES.map(v => (
                             <button key={'subj-'+v.tag} type="button" onClick={() => insertVariable('subject', v.tag)} className="text-[10px] bg-brand-indigo/20 text-brand-indigo px-1.5 py-0.5 rounded hover:bg-brand-indigo hover:text-white transition-colors" title={`Insert ${v.label}`}>+ {v.label}</button>
                          ))}
                       </div>
                    </label>
                    <input required type="text" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-brand-indigo outline-none" value={newTemplate.subject} onChange={e => setNewTemplate({...newTemplate, subject: e.target.value})} placeholder="Application for Software Engineer" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1 flex justify-between items-center">
                      <span>Body Content</span>
                      <div className="flex gap-1">
                          {AVAILABLE_VARIABLES.map(v => (
                             <button key={'body-'+v.tag} type="button" onClick={() => insertVariable('body', v.tag)} className="text-[10px] bg-brand-indigo/20 text-brand-indigo px-1.5 py-0.5 rounded hover:bg-brand-indigo hover:text-white transition-colors" title={`Insert ${v.label}`}>+ {v.label}</button>
                          ))}
                      </div>
                    </label>
                    <textarea required rows={8} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white focus:border-brand-indigo outline-none font-mono text-sm" value={newTemplate.body} onChange={e => setNewTemplate({...newTemplate, body: e.target.value})} placeholder="Hi Team at {{company_name}}, ..." />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Resume Attachment (PDF)</label>
                    <input type="file" accept=".pdf" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-2 text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-indigo file:text-white hover:file:bg-brand-violet transition-all" onChange={e => setNewTemplate({...newTemplate, resume: e.target.files[0]})} />
                    {editingTemplateId && templates.find(t => t.id === editingTemplateId)?.resume && (
                       <div className="mt-2 flex flex-col gap-1">
                          <p className="text-xs text-slate-500 italic flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500" /> Existing resume is already attached.</p>
                          <a href={templates.find(t => t.id === editingTemplateId).resume} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-indigo hover:underline flex items-center gap-1 w-fit">
                             View currently attached document
                          </a>
                       </div>
                    )}
                 </div>
                 <button type="submit" className="w-full btn-primary py-3 rounded-xl flex justify-center items-center gap-2">
                    <Plus size={18} /> {editingTemplateId ? 'Update Template' : 'Save Template'}
                 </button>
              </form>
           </div>
           <div className="glass-card p-6">
             <h3 className="text-xl font-bold text-white mb-6">Saved Templates</h3>
             <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {templates.length === 0 ? (
                   <p className="text-slate-500 italic text-center p-8">No templates saved yet.</p>
                ) : templates.map(t => (
                  <div key={t.id} className="p-4 border border-white/5 bg-slate-900/40 rounded-xl hover:bg-white/5 transition-colors group relative">
                     <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(t)} className="text-xs font-bold text-brand-indigo hover:text-white px-3 py-1 bg-brand-indigo/10 rounded-lg">Edit</button>
                        <button onClick={() => handleDeleteTemplate(t.id)} className="text-xs font-bold text-red-400 hover:text-white px-3 py-1 bg-red-500/10 rounded-lg">Delete</button>
                     </div>
                     <h4 className="font-bold text-brand-indigo mb-1 pr-32">{t.name}</h4>
                     <p className="text-sm text-slate-300 mb-3 font-medium border-b border-white/5 pb-2">Subject: {t.subject}</p>
                     <p className="text-xs text-slate-400 whitespace-pre-wrap font-mono">{t.body}</p>
                     {t.resume && (
                        <div className="mt-3 flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg w-fit">
                           <CheckCircle size={14} className="text-emerald-500" />
                           <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Resume Attached</span>
                           <a href={t.resume} target="_blank" rel="noopener noreferrer" className="ml-2 text-[10px] text-brand-indigo hover:underline">View File</a>
                        </div>
                     )}
                  </div>
                ))}
             </div>
           </div>
        </motion.div>
      )}

      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 overflow-x-auto">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Outreach Tracking Logs</h3>
              <span className="text-sm font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">{filteredLogs.length} Records</span>
           </div>
           
           <div className="flex flex-col md:flex-row gap-4 mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700 flex-wrap">
             <input type="text" placeholder="Search company, email, or template..." className="flex-1 min-w-[200px] bg-black/20 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-brand-indigo outline-none" value={logSearch} onChange={e => setLogSearch(e.target.value)} />
             
             <select className="bg-black/20 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-brand-indigo outline-none min-w-[150px]" value={logLocationFilter} onChange={e => setLogLocationFilter(e.target.value)}>
                <option value="">All Locations</option>
                {uniqueLogLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
             </select>

             <select className="bg-black/20 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-brand-indigo outline-none min-w-[150px]" value={logStatusFilter} onChange={e => setLogStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="Sent">Sent</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Invalid">Invalid</option>
             </select>

             <select className="bg-black/20 border border-slate-700 rounded-lg p-2 text-sm text-white focus:border-brand-indigo outline-none min-w-[150px]" value={logDateFilter} onChange={e => setLogDateFilter(e.target.value)}>
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
             </select>
           </div>

           <table className="w-full text-left">
              <thead>
                 <tr>
                    <th className="p-4 text-sm font-bold text-slate-400 border-b border-white/10 uppercase bg-white/5 rounded-tl-xl">Company</th>
                    <th className="p-4 text-sm font-bold text-slate-400 border-b border-white/10 uppercase bg-white/5">Target Email</th>
                    <th className="p-4 text-sm font-bold text-slate-400 border-b border-white/10 uppercase bg-white/5">Template</th>
                    <th className="p-4 text-sm font-bold text-slate-400 border-b border-white/10 uppercase bg-white/5">Status</th>
                    <th className="p-4 text-sm font-bold text-slate-400 border-b border-white/10 uppercase bg-white/5 rounded-tr-xl">Sent At</th>
                 </tr>
              </thead>
              <tbody>
                 {filteredLogs.length === 0 ? (
                   <tr><td colSpan="5" className="p-8 text-center text-slate-500">No email logs match your filters.</td></tr>
                 ) : filteredLogs.map(log => (
                   <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-sm text-white font-medium">{log.company_name}</td>
                      <td className="p-4 text-sm text-slate-300">{log.recipient_email}</td>
                      <td className="p-4 text-sm text-brand-indigo">{log.template_name}</td>
                      <td className="p-4">
                         {log.status === 'Sent' ? <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold"><CheckCircle size={14}/> SENT</span> :
                          log.status === 'Pending' ? <span className="flex items-center gap-1 text-orange-400 text-xs font-bold"><Clock size={14}/> PENDING</span> :
                                                    log.status === 'Invalid' ? (
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1 text-amber-400 text-xs font-bold"><AlertTriangle size={14}/> INVALID</span>
                              <button onClick={() => handleMarkInvalid(log.company)} className="text-[9px] text-slate-500 hover:text-white underline text-left">Blacklist Contact</button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="flex items-center gap-1 text-red-400 text-xs font-bold"><XCircle size={14}/> FAILED</span>
                              <button onClick={() => handleMarkInvalid(log.company)} className="text-[9px] text-slate-500 hover:text-white underline text-left">Blacklist Contact</button>
                            </div>
                          )}
                      </td>
                      <td className="p-4 text-sm text-slate-400">{log.sent_at ? new Date(log.sent_at).toLocaleString() : '-'}</td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </motion.div>
      )}
    </div>
  );
};

export default EmailCampaigns;
