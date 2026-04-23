import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Calendar, UserCircle, Building2, CheckSquare, Compass, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const navLinkClass = ({ isActive }) =>
  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
    isActive
      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`;

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const avatarInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';
  const avatarSrc = user?.avatar || null;

  const sidebarContent = (
    <div className="w-64 glass border-r border-gray-200 dark:border-gray-800 flex flex-col h-full transition-colors duration-300">
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
          Job Tracker Pro
        </h1>
        <button onClick={onClose} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {[
          { to: "/", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
          { to: "/jobs", icon: <Briefcase size={20} />, label: "Jobs" },
          { to: "/companies", icon: <Building2 size={20} />, label: "Companies" },
          { to: "/todos", icon: <CheckSquare size={20} />, label: "Todos" },
          { to: "/discover", icon: <Compass size={20} />, label: "Discover Jobs" },
          { to: "/calendar", icon: <Calendar size={20} />, label: "Calendar" },
        ].map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass} onClick={() => window.innerWidth < 768 && onClose()}>
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <NavLink
          to="/profile"
          onClick={() => window.innerWidth < 768 && onClose()}
          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-blue-500/40 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {avatarSrc ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" /> : avatarInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
              {user?.name || 'User'}
            </p>
            <p className={`text-xs font-medium capitalize truncate leading-tight mt-0.5 ${user?.role === 'admin' ? 'text-purple-500' : 'text-blue-400'}`}>
              {user?.role || 'user'}
            </p>
          </div>
          <UserCircle size={15} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors flex-shrink-0" />
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 md:hidden"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
