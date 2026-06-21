import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  CalendarDays, 
  LayoutDashboard, 
  Target, 
  LogOut,
  Bell,
  Search,
  Zap,
  User,
  X,
  Briefcase,
  Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../zenbyte_logo.png';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', permission: 'ANALYTICS_ACCESS' },
  { icon: Briefcase, label: 'Applications', path: '/jobs', permission: 'JOB_MANAGEMENT' },
  { icon: Building2, label: 'Companies', path: '/companies', permission: 'JOB_MANAGEMENT' },
  { icon: Zap, label: 'Discover', path: '/discover', permission: 'JOB_MANAGEMENT' },
  { icon: Mail, label: 'Outreach', path: '/campaigns', permission: 'EMAIL_CAMPAIGNS' }
];

const Navbar = () => {
  const { user, logout, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/insights/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.insights.rawSignals || [];
        
        const mapped = raw.map(sig => {
          const diff = Math.floor((Date.now() - new Date(sig.generated_at).getTime()) / 60000);
          const time = diff < 1 ? 'Just now' : diff < 60 ? `${diff}m ago` : `${Math.floor(diff/60)}h ago`;
          
          return {
            id: sig.id,
            title: sig.insight_type === 'ADMIN_NUDGE' ? 'System Nudge' : 
                   sig.insight_type === 'JOB_SUGGESTION' ? 'AI Suggestion' : 'Smart Insight',
            message: sig.message,
            type: sig.insight_type === 'ADMIN_NUDGE' ? 'nudge' : 'tip',
            time,
            insight_type: sig.insight_type,
            is_read: sig.is_read
          };
        });

        if (mapped.length > notifications.length && notifications.length > 0) {
           toast.success("New AI Signal Received", { icon: '📡' });
        }

        setNotifications(mapped);
        setUnreadCount(mapped.filter(n => !n.is_read).length);
      }
    } catch (err) {
      console.error("Notif fetch failed", err);
    }
  };

  const handleNotifClick = async (notif) => {
    try {
      // Optimistic Status Update (Don't remove from list)
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
      if (!notif.is_read) setUnreadCount(prev => Math.max(0, prev - 1));

      // Mark as read in backend
      await fetch(`/api/insights/${notif.id}/read/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      // Navigation Logic
      if (notif.insight_type === 'JOB_SUGGESTION') {
        const urlMatch = notif.message.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          window.open(urlMatch[0], '_blank');
        } else {
          navigate('/discover');
        }
      } else if (notif.insight_type === 'ADMIN_NUDGE') {
        navigate('/'); 
      }
      
      // Keep dropdown open so they can see it's now 'read' or close if desired. 
      // User asked to 'track viewd/not viewd', so let's keep it open or let them click away.
    } catch (err) {
      console.error("Failed to update notification status", err);
    }
  };

  const markAllAsRead = async () => {
     try {
       setNotifications([]);
       setUnreadCount(0);
        await fetch('/api/insights/clear-all/', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
       toast.success("Sentinel history cleared");
     } catch (err) {
       toast.error("Failed to clear history");
     }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Check every 30s
    
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-surface-950/80 backdrop-blur-2xl border-b border-white/5 safe-padding">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-full flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="ZenByte Logo" className="w-10 h-10 object-contain rounded-xl hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/')} />
          <span className="font-black text-xl tracking-tight text-white hidden md:block">
            ZenByte <span className="text-brand-indigo font-medium">Job Tracker</span>
          </span>
        </div>

        {/* Desktop Navigation Link */}
        <div className="hidden lg:flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const hasPermission = user?.permissions && (user.permissions.includes('ALL') || user.permissions.includes(item.permission));
            if (!hasPermission) return null;
            
            const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2.5 rounded-2xl flex items-center gap-2 text-sm font-semibold transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-brand-indigo' : ''} />
                {item.label}
                {isActive && (
                  <motion.div 
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-indigo transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-white/5 border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-indigo/50 focus:w-64 transition-all w-48"
            />
          </div>

          <button 
            onClick={() => navigate('/calendar')}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Interview Calendar"
          >
            <CalendarDays size={18} />
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsDropdownOpen(false); // close profile if open
                if (!isNotificationsOpen) setUnreadCount(0);
              }}
              className="relative w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-indigo animate-pulse"></span>}
            </button>
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 glass-dropdown p-2 z-50 origin-top-right border border-white/5 shadow-2xl"
                >
                  <div className="px-3 py-2 border-b border-white/10 mb-2 flex justify-between items-center">
                    <p className="text-sm font-bold text-white">Sentinel Center</p>
                    <button 
                      onClick={markAllAsRead}
                      className="text-[10px] text-red-500 hover:text-red-400 transition-colors uppercase font-black tracking-widest"
                    >
                      Wipe Signals
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-1 space-y-2">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center"><p className="text-xs text-slate-500 italic">No signals currently logged.</p></div>
                    ) : notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleNotifClick(notif)}
                        className={`flex gap-3 p-3 rounded-2xl transition-all cursor-pointer border ${
                          notif.is_read 
                            ? 'bg-white/[0.02] border-white/5 opacity-60 grayscale-[0.5]' 
                            : notif.type === 'nudge' 
                              ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                              : 'bg-brand-indigo/10 border-brand-indigo/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]'
                        } hover:opacity-100 hover:grayscale-0 hover:border-white/20`}
                      >
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            notif.is_read ? 'bg-white/5 text-slate-500' : 
                            notif.type === 'nudge' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-brand-indigo/20 text-brand-indigo'
                         }`}>
                           {notif.type === 'nudge' ? <Zap size={18} /> : <Briefcase size={18} />}
                         </div>
                         <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-start mb-0.5">
                               <p className={`text-sm font-bold ${
                                 notif.is_read ? 'text-slate-400' : 
                                 notif.type === 'nudge' ? 'text-emerald-400' : 'text-white'
                               }`}>{notif.title}</p>
                               <span className="text-[9px] text-slate-500 whitespace-nowrap ml-2 uppercase font-black">{notif.time}</span>
                            </div>
                            <p className={`text-xs leading-relaxed line-clamp-2 ${notif.is_read ? 'text-slate-500' : 'text-slate-300'}`}>{notif.message}</p>
                         </div>
                         {!notif.is_read && (
                           <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo mt-2 shrink-0 animate-pulse" />
                         )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                setIsNotificationsOpen(false); // close notifs if open
              }}
              className="w-10 h-10 rounded-full bg-brand-indigo/20 border border-brand-indigo/30 p-0.5 overflow-hidden transition-transform hover:scale-105"
            >
               {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-surface-800 flex items-center justify-center text-white font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-56 glass-dropdown p-2 z-50 origin-top-right"
                >
                  <div className="px-3 py-2 border-b border-white/10 mb-2">
                    <p className="text-sm font-bold text-white">{user?.name}</p>
                    <p className="text-xs text-slate-400">{user?.email}</p>
                  </div>
                  
                  <NavLink onClick={() => setIsDropdownOpen(false)} to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                    <User size={16} /> Profile
                  </NavLink>

                  {user?.permissions && (user.permissions.includes('ALL') || user.permissions.includes('SYSTEM_CONTROL')) && (
                    <NavLink onClick={() => setIsDropdownOpen(false)} to="/admin/rbac" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-indigo hover:text-white hover:bg-brand-indigo/20 transition-colors">
                      <LayoutDashboard size={16} /> Security Hub
                    </NavLink>
                  )}
                  
                  {user?.permissions && (user.permissions.includes('ALL') || user.permissions.includes('USER_MANAGEMENT')) && (
                    <NavLink onClick={() => setIsDropdownOpen(false)} to="/admin/users" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-brand-blue hover:text-white hover:bg-brand-blue/20 transition-colors">
                      <User size={16} /> Directory
                    </NavLink>
                  )}
                  
                  <button 
                    onClick={() => { setIsDropdownOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Nav (Bottom Bar) */}
    <div className="lg:hidden fixed bottom-6 left-4 right-4 glass-card p-2 flex items-center justify-between z-50">
        {NAV_ITEMS.map((item) => {
          const hasPermission = user?.permissions && (user.permissions.includes('ALL') || user.permissions.includes(item.permission));
          if (!hasPermission) return null;
          
          const isActive = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== '/');
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`p-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-brand-indigo bg-white/5' : 'text-slate-400 hover:text-white'
              }`}
            >
              <item.icon size={20} />
            </NavLink>
          );
        })}
    </div>
    </>
  );
};

export default Navbar;
