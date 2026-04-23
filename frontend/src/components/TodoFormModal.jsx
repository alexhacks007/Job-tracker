import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, ChevronDown, Image, Bell, Clock, Calendar, Tag, Save, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRIORITIES = [
  { value: 'Low',    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { value: 'Medium', color: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' },
  { value: 'High',   color: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  { value: 'Urgent', color: 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10' },
];

const inpBase = "w-full rounded-2xl border border-white/5 p-3.5 bg-white/5 text-sm text-white focus:ring-2 focus:ring-brand-indigo outline-none transition-all placeholder:text-slate-600";
const lblBase = "text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2 block";

const empty = {
  title: '', description: '', company_id: '', company_name: '',
  priority: 'Medium', status: 'pending',
  start_date: '', start_time: '', end_date: '', end_time: '',
  alert_enabled: false, alert_type: 'days_before', alert_days_before: 1, alert_time: '09:00',
  image: null, tags: '',
};

const TodoFormModal = ({ isOpen, onClose, onSave, todo }) => {
  const { token } = useAuth();
  const [form, setForm] = useState(empty);
  const [companies, setCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDrop, setShowCompanyDrop] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/companies', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setCompanies(Array.isArray(d) ? d : [])).catch(() => {});

    if (todo) {
      setForm({
        ...todo,
        alert_enabled: !!todo.alert_enabled,
        alert_days_before: todo.alert_days_before || 1,
        alert_time: todo.alert_time || '09:00',
        alert_type: todo.alert_type || 'days_before',
      });
      setCompanySearch(todo.company_name || '');
      setTagList(todo.tags ? JSON.parse(todo.tags) : []);
      setImagePreview(todo.image || null);
    } else {
      setForm(empty);
      setCompanySearch('');
      setTagList([]);
      setImagePreview(null);
    }
  }, [todo, isOpen, token]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = ev => { setImagePreview(ev.target.result); set('image', ev.target.result); };
    reader.readAsDataURL(file);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tagList.includes(t)) { const next = [...tagList, t]; setTagList(next); set('tags', JSON.stringify(next)); }
    setTagInput('');
  };
  const removeTag = (t) => { const next = tagList.filter(x => x !== t); setTagList(next); set('tags', JSON.stringify(next)); };

  const selectCompany = (c) => {
    set('company_id', c.id); set('company_name', c.name);
    setCompanySearch(c.name); setShowCompanyDrop(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, tags: JSON.stringify(tagList) });
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
               <div className="w-10 h-10 rounded-xl bg-brand-violet/10 flex items-center justify-center text-brand-violet">
                  <Plus size={24} />
               </div>
               {todo ? 'Refine Task' : 'Compose Goal'}
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto no-scrollbar">
            
            <div className="space-y-2">
              <label className={lblBase}>Headline</label>
              <input required type="text" value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="What's the main objective?" className={`${inpBase} text-base font-bold`} />
            </div>

            <div className="space-y-2">
              <label className={lblBase}>Detailed Intent</label>
              <textarea value={form.description || ''} onChange={e => set('description', e.target.value)}
                rows="2" placeholder="Break down the steps..." className={`${inpBase} resize-none`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="relative">
                 <label className={lblBase}>Related Company</label>
                 <div className="relative">
                   <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                   <input type="text" placeholder="Search partners..." value={companySearch}
                     onChange={e => { setCompanySearch(e.target.value); set('company_name', e.target.value); setShowCompanyDrop(true); }}
                     onFocus={() => setShowCompanyDrop(true)} onBlur={() => setTimeout(() => setShowCompanyDrop(false), 180)}
                     className={`${inpBase} pl-11`} />
                 </div>
                 {showCompanyDrop && companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase())).length > 0 && (
                   <div className="absolute z-[100] w-full mt-2 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-h-48 overflow-y-auto no-scrollbar">
                     {companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase())).map(c => (
                       <button key={c.id} type="button" onMouseDown={() => selectCompany(c)}
                         className="w-full text-left px-4 py-3 hover:bg-white/10 border-b border-white/5 last:border-0 flex items-center gap-3 transition-all">
                         <div className="w-8 h-8 rounded-lg bg-brand-violet/20 flex items-center justify-center text-brand-violet text-xs font-black shrink-0">
                           {c.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-white leading-none">{c.name}</p>
                            {c.email && <p className="text-[10px] text-slate-500 mt-1">{c.email}</p>}
                         </div>
                       </button>
                     ))}
                   </div>
                 )}
               </div>

               <div>
                 <label className={lblBase}>Execution Status</label>
                 <select value={form.status} onChange={e => set('status', e.target.value)} className={inpBase}>
                   <option value="pending">Pending</option>
                   <option value="in_progress">Active Execution</option>
                   <option value="done">Completed</option>
                 </select>
               </div>
            </div>

            <div>
              <label className={lblBase}>Priority Level</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRIORITIES.map(p => (
                  <button key={p.value} type="button" onClick={() => set('priority', p.value)}
                    className={`py-3 rounded-2xl border transition-all text-xs font-bold
                      ${form.priority === p.value ? 'bg-brand-indigo border-brand-indigo text-white shadow-lg' : `${p.color} border-transparent opacity-60 hover:opacity-100`}`}>
                    {p.value}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className={lblBase}><Calendar size={12} className="inline mr-1" />Start Timeline</label>
                <div className="flex gap-2">
                   <input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} className={inpBase} />
                   <input type="time" value={form.start_time || ''} onChange={e => set('start_time', e.target.value)} className={inpBase} />
                </div>
              </div>
              <div className="space-y-3">
                <label className={lblBase}><Clock size={12} className="inline mr-1" />Deadline Target</label>
                <div className="flex gap-2">
                   <input type="date" value={form.end_date || ''} onChange={e => set('end_date', e.target.value)} className={inpBase} />
                   <input type="time" value={form.end_time || ''} onChange={e => set('end_time', e.target.value)} className={inpBase} />
                </div>
              </div>
            </div>

            {/* Smart Alerts */}
            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-xl ${form.alert_enabled ? 'bg-brand-violet/20 text-brand-violet' : 'bg-white/5 text-slate-500'}`}>
                        <Bell size={20} />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-white">Smart Reminders</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Stay on top of deadlines</p>
                     </div>
                  </div>
                  <button type="button" onClick={() => set('alert_enabled', !form.alert_enabled)}
                    className={`w-12 h-6 rounded-full transition-all relative ${form.alert_enabled ? 'bg-brand-violet' : 'bg-slate-800'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${form.alert_enabled ? 'right-1' : 'left-1'}`} />
                  </button>
               </div>

               {form.alert_enabled && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                       <label className={lblBase}>Alert Timing</label>
                       <input type="time" value={form.alert_time} onChange={e => set('alert_time', e.target.value)} className={inpBase} />
                    </div>
                    <div className="space-y-2">
                       <label className={lblBase}>Lead Time (Days)</label>
                       <input type="number" min="1" value={form.alert_days_before} onChange={e => set('alert_days_before', e.target.value)} className={inpBase} />
                    </div>
                 </div>
               )}
            </div>

            <div>
              <label className={lblBase}><Tag size={12} className="inline mr-1" />Topic Labels</label>
              <div className="flex gap-3">
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="e.g. negotiation, research..." className={`${inpBase} flex-1`} />
                <button type="button" onClick={addTag} className="px-6 py-2 rounded-2xl bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition-all">Add</button>
              </div>
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {tagList.map(t => (
                    <span key={t} className="flex items-center gap-2 px-3 py-1.5 bg-brand-violet/10 text-brand-violet text-[10px] font-black uppercase tracking-widest rounded-full border border-brand-violet/20 group/tag">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-red-500"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t border-white/5">
              <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-500 hover:text-white transition-all font-bold">Cancel</button>
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save size={18} /> {todo ? 'Commit Changes' : 'Initialize Task'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TodoFormModal;

