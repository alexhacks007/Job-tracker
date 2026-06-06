import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  CheckSquare, 
  Search, 
  Bell, 
  Clock,
  User, 
  LogOut, 
  Menu, 
  X,
  Compass,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import debounce from 'lodash/debounce';

const NavTabs = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Jobs', path: '/jobs', icon: Briefcase },
  { name: 'Companies', path: '/companies', icon: Building2 },
  { name: 'Todos', path: '/todos', icon: CheckSquare },
  { name: 'Discover', path: '/discover', icon: Compass },
];

const Navigation = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ jobs: [], companies: [], todos: [] });
  const [isSearching, setIsSearching] = useState(false);

  // Global search fetcher
  const performSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setSearchResults({ jobs: [], companies: [], todos: [] });
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [jobsRes, cosRes, todosRes] = await Promise.all([
          fetch('/api/jobs/', { headers }),
          fetch('/api/companies/', { headers }),
          fetch('/api/todos/', { headers }),
        ]);

        const [jobs, cos, todos] = await Promise.all([
          jobsRes.ok ? jobsRes.json() : [],
          cosRes.ok ? cosRes.json() : [],
          todosRes.ok ? todosRes.json() : [],
        ]);

        setSearchResults({
          jobs: jobs.filter(j => j.company_name?.toLowerCase().includes(query.toLowerCase()) || j.job_role?.toLowerCase().includes(query.toLowerCase())).slice(0, 3),
          companies: cos.filter(c => c.name?.toLowerCase().includes(query.toLowerCase())).slice(0, 3),
          todos: todos.filter(t => t.title?.toLowerCase().includes(query.toLowerCase())).slice(0, 3),
        });
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [token]
  );

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  const hasResults = searchResults.jobs.length > 0 || searchResults.companies.length > 0 || searchResults.todos.length > 0;

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications (interviews + recent activity)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/dashboard/stats/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Merge interviews and recent applications into a sorted notification stream
          const items = [
            ...(data.upcomingInterviews || []).map(i => ({ ...i, type: 'interview', date: i.interview_date })),
            ...(data.recentJobs || []).map(j => ({ ...j, type: 'status', date: j.applied_date })),
          ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
          setNotifications(items);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    if (token) fetchNotifications();
  }, [token]);

  return (
    <nav className="sticky top-0 z-50 w-full glass border-b border-white/5 bg-slate-950/50">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
             <div className="w-9 h-9 bg-gradient-to-br from-brand-indigo to-brand-violet rounded-xl flex items-center justify-center shadow-lg shadow-brand-indigo/20 group-hover:scale-105 transition-transform">
                <Briefcase className="text-white w-5 h-5" />
             </div>
             <span className="hidden md:block font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                JobTracker<span className="text-brand-indigo">.</span>
             </span>
          </div>

          {/* Nav Tabs - Desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {NavTabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={tab.path}
                className={({ isActive }) => `
                  relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <tab.icon className="w-4 h-4" />
                    {tab.name}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-white/10 rounded-full -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            
            {/* Search Container */}
            <div className="relative hidden md:block">
               <div className={`
                 flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300
                 ${searchFocused 
                   ? 'w-72 bg-slate-900 border-white/20 ring-1 ring-white/10' 
                   : 'w-48 bg-white/5 border-white/5 hover:border-white/10'}
               `}>
                 <Search className="w-4 h-4 text-slate-500" />
                 <input 
                   type="text" 
                   placeholder="Search..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onFocus={() => setSearchFocused(true)}
                   onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                   className="bg-transparent border-none outline-none text-xs text-slate-200 w-full placeholder:text-slate-600"
                 />
               </div>

               {/* Search Results Dropdown */}
               <AnimatePresence>
                 {searchFocused && (searchQuery.length > 1) && (
                   <motion.div
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute right-0 mt-3 w-80 glass-dropdown p-4 z-50 overflow-y-auto no-scrollbar"
                   >
                     {isSearching ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-3">
                           <div className="w-6 h-6 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin" />
                           <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Searching Hub...</p>
                        </div>
                     ) : !hasResults ? (
                        <div className="py-8 text-center">
                           <p className="text-sm font-bold text-slate-400">No matches found.</p>
                           <p className="text-[10px] text-slate-600 mt-1">Try keywords like "Google", "Frontend", or "Offer".</p>
                        </div>
                     ) : (
                        <div className="space-y-6">
                           {/* Jobs Section */}
                           {searchResults.jobs.length > 0 && (
                             <div>
                               <div className="flex items-center gap-2 mb-2 px-2">
                                  <Briefcase size={12} className="text-brand-indigo" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Jobs</span>
                               </div>
                               {searchResults.jobs.map(j => (
                                 <button key={j.id} onClick={() => navigate('/jobs')} className="w-full text-left p-2 hover:bg-white/5 rounded-xl transition-colors group">
                                    <p className="text-xs font-bold text-white group-hover:text-brand-indigo">{j.job_role}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{j.company_name}</p>
                                 </button>
                               ))}
                             </div>
                           )}

                           {/* Companies Section */}
                           {searchResults.companies.length > 0 && (
                             <div>
                               <div className="flex items-center gap-2 mb-2 px-2">
                                  <Building2 size={12} className="text-brand-blue" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Partners</span>
                               </div>
                               {searchResults.companies.map(c => (
                                 <button key={c.id} onClick={() => navigate('/companies')} className="w-full text-left p-2 hover:bg-white/5 rounded-xl transition-colors group flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-brand-blue">
                                       {c.name.charAt(0)}
                                    </div>
                                    <p className="text-xs font-bold text-white group-hover:text-brand-blue">{c.name}</p>
                                 </button>
                               ))}
                             </div>
                           )}

                           {/* Todos Section */}
                           {searchResults.todos.length > 0 && (
                             <div>
                               <div className="flex items-center gap-2 mb-2 px-2">
                                  <CheckSquare size={12} className="text-brand-violet" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Action Items</span>
                               </div>
                               {searchResults.todos.map(t => (
                                 <button key={t.id} onClick={() => navigate('/todos')} className="w-full text-left p-2 hover:bg-white/5 rounded-xl transition-colors group">
                                    <p className="text-xs font-bold text-white group-hover:text-brand-violet line-clamp-1">{t.title}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Priority: {t.priority}</p>
                                 </button>
                               ))}
                             </div>
                           )}
                        </div>
                     )}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            <button 
              onClick={() => navigate('/calendar')}
              className="p-2 transition-colors relative rounded-full text-slate-400 hover:text-white hover:bg-white/5"
              title="Interview Calendar"
            >
               <Calendar size={20} />
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 transition-colors relative rounded-full ${isNotificationsOpen ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                 <Bell className="w-5 h-5" />
                 {notifications.length > 0 && (
                   <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-violet rounded-full border-2 border-slate-950 animate-pulse"></span>
                 )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 glass-dropdown p-4 z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-4 px-2">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Latest Alerts</h4>
                         <span className="text-[9px] font-bold text-brand-violet bg-brand-violet/10 px-2 py-0.5 rounded-full">{notifications.length} New</span>
                      </div>
                      <div className="space-y-2">
                        {notifications.length > 0 ? (
                          notifications.map((n, i) => (
                            <button 
                              key={i} 
                              onClick={() => { setIsNotificationsOpen(false); navigate(n.type === 'interview' ? '/calendar' : '/jobs'); }}
                              className="w-full text-left p-3 hover:bg-white/5 rounded-2xl transition-all flex gap-3 group"
                            >
                               <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.type === 'interview' ? 'bg-orange-500/10 text-orange-500' : 'bg-brand-indigo/10 text-brand-indigo'}`}>
                                  {n.type === 'interview' ? <Clock size={14} /> : <Briefcase size={14} />}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-bold text-white group-hover:text-brand-indigo transition-colors truncate">
                                     {n.type === 'interview' ? `Interview with ${n.company_name}` : `Applied to ${n.company_name}`}
                                  </p>
                                  <p className="text-[9px] text-slate-500 mt-0.5 flex items-center justify-between">
                                     <span className="truncate">{n.job_role}</span>
                                     <span className="shrink-0">{new Date(n.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                  </p>
                               </div>
                            </button>
                          ))
                        ) : (
                          <div className="py-8 text-center bg-white/5 rounded-[1.5rem] border border-dashed border-white/10">
                             <p className="text-xs text-slate-500 font-bold italic">All caught up!</p>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => { setIsNotificationsOpen(false); navigate('/calendar'); }}
                        className="w-full mt-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                      >
                         View Full Timeline
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
               <button 
                 onClick={() => setIsProfileOpen(!isProfileOpen)}
                 className="flex items-center gap-2 p-1 pl-3 rounded-full border border-white/5 hover:border-white/10 transition-colors bg-white/5"
               >
                  <span className="hidden sm:block text-xs font-semibold text-slate-300">{user?.name}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                     {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-slate-400" />}
                  </div>
               </button>

               <AnimatePresence>
                 {isProfileOpen && (
                   <>
                     <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                     <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 glass-dropdown p-2 z-50 overflow-hidden"
                     >
                        <div className="p-4 bg-white/5 rounded-[1.5rem] mb-2">
                           <p className="text-sm font-bold text-white leading-none">{user?.name}</p>
                           <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">{user?.email}</p>
                        </div>
                        <div className="p-1 space-y-1">
                          <button onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}
                            className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                             <div className="flex items-center gap-3"><User size={14} /> Account Matrix</div>
                             <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                          </button>
                          <button onClick={() => { setIsProfileOpen(false); logout(); }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                             <LogOut size={14} /> Terminate Session
                          </button>
                        </div>
                     </motion.div>
                   </>
                 )}
               </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden p-2 text-slate-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
               {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-white/5 bg-slate-950 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 rounded-2xl mb-4">
                 <Search size={16} className="text-slate-500" />
                 <input type="text" placeholder="Global search..." className="bg-transparent border-none outline-none text-sm text-white w-full" />
              </div>
              {NavTabs.map((tab) => (
                <NavLink
                  key={tab.name}
                  to={tab.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all
                    ${isActive ? 'bg-brand-indigo/10 text-brand-indigo' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                  `}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.name}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navigation;

