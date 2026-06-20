import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, CheckCircle2, Circle, Clock, Zap,
  Edit2, Trash2, Bell, BellOff, Building2, Calendar,
  Filter, AlertTriangle, CheckCheck, ChevronDown, ListTodo, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import TodoFormModal from '../components/TodoFormModal';
import { useTodoAlerts } from '../hooks/useTodoAlerts';
import Skeleton from '../components/Skeleton';

const PRIORITY_CONFIG = {
  Low:    { badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-500' },
  Medium: { badge: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20', dot: 'bg-brand-blue' },
  High:   { badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20', dot: 'bg-orange-500' },
  Urgent: { badge: 'bg-red-500/10 text-red-500 border-red-500/20 shadow-red-500/10', dot: 'bg-red-500' },
};

const STATUS_CONFIG = {
  pending:     { label: 'Pending',      icon: Circle,        color: 'text-slate-500' },
  in_progress: { label: 'In Progress',  icon: Zap,           color: 'text-orange-500' },
  done:        { label: 'Completed',    icon: CheckCircle2,  color: 'text-emerald-500' },
};

const getDaysUntil = (endDate) => {
  if (!endDate) return null;
  const diff = Math.ceil((new Date(endDate) - new Date(new Date().toDateString())) / (1000 * 60 * 60 * 24));
  return diff;
};

const DeadlineBadge = ({ endDate }) => {
  const days = getDaysUntil(endDate);
  if (days === null) return null;
  if (days < 0)  return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20">Overdue {Math.abs(days)}d</span>;
  if (days === 0) return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">Due Today</span>;
  if (days <= 2)  return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20">Due in {days}d</span>;
  return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-white/5 text-slate-400 border border-white/5">{endDate}</span>;
};

const TodoCard = React.forwardRef(({ todo, onEdit, onDelete, onStatusChange }, ref) => {
  const pc = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.Medium;
  const sc = STATUS_CONFIG[todo.status] || STATUS_CONFIG.pending;
  const StatusIcon = sc.icon;
  const tags = todo.tags ? JSON.parse(todo.tags) : [];
  const isDone = todo.status === 'done';

  const cycleStatus = () => {
    const order = ['pending', 'in_progress', 'done'];
    const next = order[(order.indexOf(todo.status) + 1) % order.length];
    onStatusChange(todo.id, next);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`glass group p-6 rounded-[2rem] border relative overflow-hidden transition-all
        ${isDone ? 'opacity-50 border-white/5' : 'border-white/5 hover:border-white/10 hover:shadow-2xl hover:shadow-brand-indigo/5'}`}
      ref={ref}
    >
      {/* Priority Stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${pc.dot}`} />

      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <button 
            onClick={cycleStatus} 
            className={`mt-1 flex-shrink-0 transition-all active:scale-90 hover:scale-110 ${sc.color}`}
          >
            <StatusIcon size={22} strokeWidth={isDone ? 2 : 2.5} />
          </button>

          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-bold text-white transition-opacity ${isDone ? 'line-through text-slate-500' : ''}`}>
              {todo.title}
            </h4>
            {todo.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{todo.description}</p>
            )}
          </div>

          <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={() => onEdit(todo)} className="p-2 text-slate-500 hover:text-brand-indigo transition-colors"><Edit2 size={16} /></button>
             <button onClick={() => onDelete(todo.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
          </div>
        </div>

        {todo.image && (
          <div className="rounded-2xl overflow-hidden border border-white/5">
             <img src={todo.image} alt="attachment" className="w-full max-h-40 object-cover" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${pc.badge}`}>{todo.priority}</span>
          
          {todo.company_name && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20">
              <Building2 size={10} /> {todo.company_name}
            </span>
          )}

          <DeadlineBadge endDate={todo.end_date} />
          
          {todo.alert_enabled && (
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-violet">
                <Bell size={10} /> Alert {todo.alert_time}
             </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
            {tags.map(t => (
              <span key={t} className="text-[9px] font-bold text-slate-500 hover:text-brand-indigo transition-colors cursor-default">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

const Todos = () => {
  const { token } = useAuth();
  const [todos, setTodos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentTodo, setCurrentTodo] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useTodoAlerts(todos);

  const fetchTodos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/todos/', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTodos(await res.json());
    } catch { toast.error('Failed to load tasks'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTodos(); }, [token]);

  const handleSave = async (form) => {
    // Clean data: convert empty strings to null for backend validation
    const cleaned = { ...form };
    ['company_id', 'start_date', 'end_date', 'start_time', 'end_time'].forEach(key => {
      if (cleaned[key] === '') cleaned[key] = null;
    });

    try {
      const isEdit = !!currentTodo;
      const url = isEdit ? `/api/todos/${currentTodo.id}/` : '/api/todos/';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(cleaned)
      });
      if (res.ok) { toast.success('Task saved'); setModalOpen(false); fetchTodos(); }
      else {
        const errorData = await res.json();
        console.error('Todo Save Error:', errorData);
        toast.error('Failed to save task. Check console for details.');
      }
    } catch { toast.error('Server error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const res = await fetch(`/api/todos/${id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { toast.success('Task deleted'); fetchTodos(); }
    } catch { toast.error('Server error'); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`/api/todos/${id}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchTodos();
    } catch { toast.error('Server error'); }
  };

  const filtered = useMemo(() => todos.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  }), [todos, search, filterStatus, filterPriority]);

  const groups = {
    in_progress: filtered.filter(t => t.status === 'in_progress'),
    pending:     filtered.filter(t => t.status === 'pending'),
    done:        filtered.filter(t => t.status === 'done'),
  };

  const stats = {
    total: todos.length,
    done: todos.filter(t => t.status === 'done').length,
    overdue: todos.filter(t => t.status !== 'done' && getDaysUntil(t.end_date) !== null && getDaysUntil(t.end_date) < 0).length,
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="glass p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex items-center gap-4 sm:gap-5 border border-white/5">
             <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo flex-shrink-0">
                <ListTodo size={24} className="sm:w-7 sm:h-7" />
             </div>
             <div>
                <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{stats.total}</h4>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Active Goals</p>
             </div>
          </div>
          <div className="glass p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex items-center gap-4 sm:gap-5 border border-white/5">
             <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                <CheckCheck size={24} className="sm:w-7 sm:h-7" />
             </div>
             <div>
                <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{stats.done}</h4>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Completed</p>
             </div>
          </div>
          <div className="glass p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex items-center gap-4 sm:gap-5 border border-white/5">
             <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                <AlertTriangle size={24} className="sm:w-7 sm:h-7" />
             </div>
             <div>
                <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{stats.overdue}</h4>
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Overdue</p>
             </div>
          </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 sm:gap-6">
        <div>
           <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Daily Todos</h1>
           <p className="text-xs sm:text-sm text-slate-400 mt-1">Focus on what's important today.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
           <div className="relative flex-1 min-w-0 sm:min-w-[300px] w-full sm:w-auto group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-brand-indigo transition-colors" />
              <input type="text" placeholder="Filter tasks or companies..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 glass border-white/5 rounded-2xl outline-none focus:ring-2 focus:ring-brand-indigo/20 transition-all text-sm text-white placeholder:text-slate-600" />
           </div>
           
           <button onClick={() => setShowFilters(!showFilters)}
             className={`flex items-center gap-2 px-5 sm:px-6 py-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all
               ${showFilters ? 'bg-brand-indigo text-white border-brand-indigo shadow-lg' : 'glass text-slate-400 border-white/5 hover:border-white/10'}`}>
             <Filter size={16} /> Filters <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
           </button>

           <button onClick={() => { setCurrentTodo(null); setModalOpen(true); }}
             className="btn-primary flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm py-3 px-5 sm:px-6">
             <Plus size={20} /> Create Task
           </button>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-4 overflow-hidden">
            <div className="p-1.5 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-2">
               {['all', 'pending', 'in_progress', 'done'].map(s => (
                 <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-brand-indigo text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    {s}
                 </button>
               ))}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board / Tasks Stack */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {[...Array(6)].map((_, i) => (
             <Skeleton key={i} className="h-56 rounded-[2.5rem]" />
           ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-[2rem] sm:rounded-[3rem] p-12 sm:p-20 flex flex-col items-center justify-center text-center border border-white/5">
           <Layers className="w-12 h-12 sm:w-16 sm:h-16 text-slate-800 mb-6" />
           <p className="text-white font-bold text-lg sm:text-xl">Peaceful Minds.</p>
           <p className="text-slate-500 text-xs sm:text-sm mt-2">All tasks completed or none found matching your filters.</p>
        </div>
      ) : (
        <>
          {/* Mobile/Tablet view: Stacked groups vertically */}
          <div className="lg:hidden space-y-8">
            {[
              { key: 'in_progress', label: 'In Progress', color: 'bg-orange-500' },
              { key: 'pending',     label: 'Pending',     color: 'bg-brand-blue' },
              { key: 'done',        label: 'Completed',    color: 'bg-emerald-500' },
            ].map(group => groups[group.key].length > 0 && (
              <div key={group.key} className="space-y-4">
                <div className="flex items-center gap-3">
                   <div className={`h-2 w-2 rounded-full ${group.color}`} />
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{group.label}</h3>
                   <div className="flex-1 h-px bg-white/5" />
                   <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/5 text-slate-500">{groups[group.key].length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {groups[group.key].map(todo => (
                      <TodoCard
                        key={todo.id}
                        todo={todo}
                        onEdit={t => { setCurrentTodo(t); setModalOpen(true); }}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/Widescreen view: Side-by-side Kanban Board */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-start">
            {[
              { key: 'pending',     label: 'Pending',     color: 'bg-brand-blue' },
              { key: 'in_progress', label: 'In Progress', color: 'bg-orange-500' },
              { key: 'done',        label: 'Completed',    color: 'bg-emerald-500' },
            ].map(group => (
              <div key={group.key} className="glass p-5 rounded-[2rem] border border-white/5 bg-white/[0.01] flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${group.color}`} />
                    <h3 className="text-sm font-bold text-white tracking-tight">{group.label}</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/5 text-slate-400">{groups[group.key].length}</span>
                </div>
                
                <div className="space-y-4 flex-1">
                  <AnimatePresence mode="popLayout">
                    {groups[group.key].length === 0 ? (
                      <div className="h-32 rounded-2xl border border-dashed border-white/5 flex items-center justify-center text-xs text-slate-600">
                        No tasks in {group.label.toLowerCase()}
                      </div>
                    ) : (
                      groups[group.key].map(todo => (
                        <TodoCard
                          key={todo.id}
                          todo={todo}
                          onEdit={t => { setCurrentTodo(t); setModalOpen(true); }}
                          onDelete={handleDelete}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <TodoFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} todo={currentTodo} />
    </div>
  );
};

export default Todos;

