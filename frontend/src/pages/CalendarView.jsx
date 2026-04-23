import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Building2,
  X,
  Plus,
  LayoutGrid,
  CalendarDays,
  Grid3X3,
  CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';

const MiniMonth = ({ date, stats, onDateClick }) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="glass p-4 rounded-3xl border border-white/5 hover:border-white/10 transition-all">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 text-center">
        {date.toLocaleString('default', { month: 'short' })} {year}
      </h4>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map(b => <div key={`b-${b}`} className="aspect-square"></div>)}
        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const apps = stats.applicationsByDate[dateStr] || 0;
          const hasInterview = stats.interviewsByDate[dateStr]?.length > 0;
          const isCurrentToday = new Date().toDateString() === new Date(year, month, day).toDateString();
          
          // Heatmap levels
          const intensityClass = apps > 5 ? 'bg-brand-indigo shadow-[0_0_12px_rgba(99,102,241,0.6)]' 
                               : apps > 2 ? 'bg-brand-indigo/60 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                               : apps > 0 ? 'bg-brand-indigo/30' 
                               : 'bg-white/[0.03]';

          return (
            <div 
              key={day} 
              onClick={() => onDateClick(new Date(year, month, day))}
              title={`${day} ${date.toLocaleString('default', { month: 'short' })}: ${apps} applications`}
              className={`aspect-square rounded-[4px] cursor-pointer flex items-center justify-center transition-all relative
                ${intensityClass}
                ${apps > 0 ? 'scale-110 border border-white/10' : 'border border-white/5'}
                ${hasInterview ? 'ring-1 ring-orange-500/50' : ''}
                ${isCurrentToday ? 'ring-1 ring-brand-indigo bg-brand-indigo/20' : ''}
                hover:bg-white/20 hover:scale-125 hover:z-20
              `}
            >
               <span className={`text-[8px] font-black pointer-events-none select-none tracking-tighter
                 ${apps > 0 ? 'text-white' : isCurrentToday ? 'text-brand-indigo' : 'text-slate-400 opacity-60'}
               `}>
                 {day}
               </span>
               {hasInterview && (
                 <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.9)] z-10" />
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CalendarView = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [todos, setTodos] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // 'month', '6month', 'year'
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [statsRes, todosRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers }),
        fetch('/api/todos', { headers })
      ]);
      
      if (statsRes.ok && todosRes.ok) {
        setStats(await statsRes.json());
        setTodos(await todosRes.json());
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleToggleTodoStatus = async (todoId, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    try {
      const res = await fetch(`/api/todos/${todoId}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Optimistic UI update
        setTodos(prev => prev.map(t => t.id === todoId ? { ...t, status: newStatus } : t));
        toast.success(`Task marked as ${newStatus}`);
      }
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  if (loading || !stats) return (
    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[700px]">
      <Skeleton className="flex-1 rounded-[3rem]" />
      <Skeleton className="w-full lg:w-96 rounded-[3rem]" />
    </div>
  );

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const isToday = (day, m = currentDate.getMonth(), y = currentDate.getFullYear()) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
  };

  const getEventsForDate = (day, m = currentDate.getMonth(), y = currentDate.getFullYear()) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const apps = stats.applicationsByDate[dateStr] || 0;
    const interviews = stats.interviewsByDate[dateStr] || [];
    
    // Filter todos by date (start_date or end_date)
    const dayTodos = todos.filter(t => t.start_date === dateStr || t.end_date === dateStr);
    
    return { apps, interviews, dayTodos, dateStr };
  };

  const handleDateClick = (date) => {
    setCurrentDate(date);
    const { apps, interviews, dayTodos, dateStr } = getEventsForDate(date.getDate(), date.getMonth(), date.getFullYear());
    setSelectedDate({ day: date.getDate(), apps, interviews, dayTodos, dateStr });
    if (viewMode !== 'month') setViewMode('month');
  };

  const TodoItem = ({ todo }) => (
    <div 
      onClick={() => navigate('/todos')}
      className={`group p-4 rounded-3xl border transition-all flex items-center gap-4 cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] ${
      todo.status === 'done' ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' : 'bg-white/5 border-white/5 hover:border-white/10 hover:-translate-y-0.5'
    }`}>
      <button 
        onClick={(e) => { e.stopPropagation(); handleToggleTodoStatus(todo.id, todo.status); }}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
          todo.status === 'done' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700 hover:border-brand-indigo'
        }`}
      >
        {todo.status === 'done' && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckSquare size={12} /></motion.div>}
      </button>
      <div className="flex-1 min-w-0">
        <h5 className={`text-sm font-bold truncate ${todo.status === 'done' ? 'text-slate-500 line-through' : 'text-white'}`}>
          {todo.title}
        </h5>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
            todo.priority === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-500'
          }`}>
            {todo.priority}
          </span>
          {todo.company_name && (
            <span className="text-[9px] text-slate-500 font-bold truncate">@ {todo.company_name}</span>
          )}
        </div>
      </div>
    </div>
  );

  const renderMonthView = () => {
    const { days, firstDay } = getDaysInMonth(currentDate);
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    return (
      <div className="grid grid-cols-7 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-slate-900/50 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
            {d}
          </div>
        ))}
        {blanks.map(b => <div key={`b-${b}`} className="bg-slate-950/20 aspect-square md:aspect-auto md:h-28"></div>)}
        {daysArray.map(day => {
          const { apps, interviews, dayTodos, dateStr } = getEventsForDate(day);
          const hasPendingTodos = dayTodos.some(t => t.status !== 'done');
          
          return (
            <motion.div 
              key={day}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              onClick={() => setSelectedDate({ day, apps, interviews, dayTodos, dateStr })}
              className={`relative bg-slate-950/40 p-3 h-24 md:h-28 transition-all cursor-pointer group
                ${isToday(day) ? 'ring-inset ring-2 ring-brand-indigo' : ''}
                ${selectedDate?.day === day && new Date(selectedDate.dateStr).getMonth() === currentDate.getMonth() ? 'bg-white/5 z-10' : ''}
              `}
            >
              <span className={`text-sm font-bold ${isToday(day) ? 'text-brand-indigo' : 'text-slate-500'}`}>{day}</span>
              <div className="mt-2 space-y-1">
                {apps > 0 && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                    <span className="text-[10px] font-bold text-slate-300 truncate">{apps}</span>
                  </div>
                )}
                {interviews.length > 0 && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                    <span className="text-[10px] font-bold text-slate-300 truncate">{interviews.length} <span className="hidden md:inline">Call</span></span>
                  </div>
                )}
                {dayTodos.length > 0 && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${hasPendingTodos ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    <span className="text-[10px] font-bold text-slate-500 truncate">{dayTodos.length} <span className="hidden md:inline">Task</span></span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const render6MonthView = () => {
    // Mini month can be updated later if needed, but primary focus is current day/sidebar
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - i);
      return d;
    }).reverse();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {months.map((m, i) => (
          <MiniMonth key={i} date={m} stats={stats} onDateClick={handleDateClick} />
        ))}
      </div>
    );
  };

  const renderYearlyView = () => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(currentDate.getFullYear(), i, 1));
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 p-2">
        {months.map((m, i) => (
          <MiniMonth key={i} date={m} stats={stats} onDateClick={handleDateClick} />
        ))}
      </div>
    );
  };

  const highPriorityTodos = todos.filter(t => t.status !== 'done').slice(0, 5);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[700px] mb-20">
      
      {/* Main Calendar Container */}
      <div className="flex-1 glass rounded-[3rem] p-8 flex flex-col">
        {/* Header (existing code...) */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
           <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20">
                 <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                 <h2 className="text-2xl font-bold text-white tracking-tight">
                    {viewMode === 'year' ? currentDate.getFullYear() : currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                 </h2>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Application Schedule</p>
              </div>
           </div>

           <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3">
              <div className="flex w-full md:w-auto bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                 {[
                   { id: 'month', icon: CalendarDays },
                   { id: '6month', icon: Grid3X3 },
                   { id: 'year', icon: LayoutGrid }
                 ].map(mode => (
                   <button 
                     key={mode.id}
                     onClick={() => setViewMode(mode.id)}
                     className={`flex-1 md:flex-none p-2.5 flex items-center justify-center rounded-xl transition-all ${viewMode === mode.id ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20 scale-[1.02]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                   >
                      <mode.icon className="w-5 h-5 md:w-4 md:h-4" />
                   </button>
                 ))}
              </div>

              <div className="flex w-full md:w-auto items-center justify-between bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                 <button onClick={() => {
                   const jump = viewMode === 'month' ? 1 : (viewMode === '6month' ? 6 : 12);
                   setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - jump, 1));
                 }} className="p-2 px-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-95"><ChevronLeft className="w-5 h-5" /></button>
                 
                 <button onClick={() => { setCurrentDate(new Date()); setViewMode('month'); }} className="flex-1 md:flex-none px-6 py-2 text-xs font-bold text-slate-300 hover:text-white tracking-widest text-center uppercase">Today</button>
                 
                 <button onClick={() => {
                   const jump = viewMode === 'month' ? 1 : (viewMode === '6month' ? 6 : 12);
                   setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + jump, 1));
                 }} className="p-2 px-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all active:scale-95"><ChevronRight className="w-5 h-5" /></button>
              </div>
           </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode + currentDate.getFullYear() + currentDate.getMonth()}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex-1"
          >
            {viewMode === 'month' && renderMonthView()}
            {viewMode === '6month' && render6MonthView()}
            {viewMode === 'year' && renderYearlyView()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Side Details Panel */}
      <div className="w-full lg:w-96 glass rounded-[3rem] p-8 flex flex-col h-full sticky top-8">
        <AnimatePresence mode="wait">
          {selectedDate ? (
            <motion.div 
              key="selected"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="text-xl font-bold text-white">
                       {new Date(selectedDate.dateStr).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <p className="text-xs text-brand-indigo font-bold uppercase tracking-wider mt-1">Daily Tactical Snapshot</p>
                 </div>
                 <button onClick={() => setSelectedDate(null)} className="p-2 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar">
                 {/* Interviews */}
                 {selectedDate.interviews.length > 0 && (
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Interviews</h4>
                       {selectedDate.interviews.map((job, idx) => (
                          <div 
                             key={idx} 
                             onClick={() => navigate(`/jobs/${job.id}`)}
                             className="p-5 bg-orange-500/5 border border-orange-500/20 rounded-3xl relative overflow-hidden cursor-pointer hover:bg-orange-500/10 hover:-translate-y-0.5 transition-all shadow-sm shadow-orange-500/5"
                          >
                             <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
                             <h5 className="font-bold text-white">{job.job_role}</h5>
                             <p className="text-xs text-slate-400 mt-1">{job.company_name}</p>
                             <div className="flex items-center gap-4 mt-4 text-[10px] font-bold text-orange-500">
                                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Scheduled</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {job.location || 'Remote'}</span>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}

                 {/* Day Specific Todos */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Tasks</h4>
                    {(() => {
                      const dayTodos = todos.filter(t => t.start_date === selectedDate.dateStr || t.end_date === selectedDate.dateStr);
                      return dayTodos.length > 0 ? (
                        dayTodos.map(todo => <TodoItem key={todo.id} todo={todo} />)
                      ) : (
                        <div className="p-8 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                           <p className="text-[10px] text-slate-600 italic">No tasks for this day</p>
                        </div>
                      );
                    })()}
                 </div>

                 {/* Apps Summary */}
                 {selectedDate.apps > 0 && (
                    <div 
                       onClick={() => navigate('/jobs')}
                       className="p-5 bg-brand-blue/5 border border-brand-blue/20 rounded-3xl flex items-center gap-4 cursor-pointer hover:bg-brand-blue/10 hover:-translate-y-0.5 transition-all shadow-sm shadow-brand-blue/5"
                    >
                       <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-brand-blue" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white">{selectedDate.apps} Job Applications</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-widest">Submitted</p>
                       </div>
                    </div>
                 )}
              </div>
              <button onClick={() => navigate('/todos')} className="w-full btn-primary mt-8 flex items-center justify-center gap-2 py-4">
                 <Plus className="w-5 h-5" /> Add Task
              </button>
            </motion.div>
          ) : (
            <motion.div 
               key="global"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="flex-1 flex flex-col"
            >
               <div className="mb-8">
                  <h3 className="text-xl font-bold text-white tracking-tight">Mission Control</h3>
                  <p className="text-xs text-brand-indigo font-bold uppercase tracking-wider mt-1">High-Priority Focus</p>
               </div>

               <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                  {highPriorityTodos.length > 0 ? (
                    highPriorityTodos.map(todo => <TodoItem key={todo.id} todo={todo} />)
                  ) : (
                    <div className="py-20 text-center space-y-4">
                       <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                          <CheckSquare className="w-8 h-8 text-slate-700" />
                       </div>
                       <p className="text-sm text-slate-500 font-medium italic">You're all caught up!</p>
                       <button onClick={() => navigate('/todos')} className="text-xs font-bold text-brand-indigo hover:underline">View All Tasks</button>
                    </div>
                  )}
               </div>

               <div className="mt-auto pt-8 border-t border-white/5">
                  <div className="p-6 bg-brand-indigo/5 rounded-[2.5rem] border border-brand-indigo/10 space-y-3">
                     <h4 className="text-xs font-black text-white uppercase tracking-widest text-center">Interviews Today</h4>
                     <p className="text-3xl font-black text-brand-indigo text-center">
                        {stats.upcomingInterviews.filter(i => new Date(i.interview_date).toDateString() === new Date().toDateString()).length}
                     </p>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CalendarView;
