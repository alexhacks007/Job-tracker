import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, UserPlus, Activity, Mail, LogIn, ExternalLink, CalendarDays, Trash2, Eye, X, ShieldAlert, List } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create user modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role_id: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rbacRes] = await Promise.all([
        fetch('/api/rbac/users-activity', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/rbac', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (usersRes.ok && rbacRes.ok) {
        setUsers(await usersRes.json());
        const rbacData = await rbacRes.json();
        setRoles(rbacData.roles || []);
      } else {
        toast.error('Failed to load users data');
      }
    } catch (err) {
      toast.error('Server error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
       return toast.error('Please fill all required fields');
    }
    
    try {
      const res = await fetch('/api/rbac/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      
      if (res.ok) {
        toast.success('User Provisioned Securely');
        setIsModalOpen(false);
        setNewUser({ name: '', email: '', password: '', role_id: '' });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Creation failed');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("WARNING: Are you sure you want to terminate this account? All associated data will be completely wiped.")) return;
    try {
      const res = await fetch(`/api/rbac/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Account terminated successfully");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.message || 'Termination failed');
      }
    } catch(err) {
      toast.error('Server error');
    }
  };

  const handleViewActivity = (user) => {
    const userId = user.id ?? user._id ?? user.ID ?? user.Id;
    if (userId === undefined || userId === null || userId === 'undefined') {
      console.error("FATAL: Could not locate ID in user object:", user);
      toast.error(`System Error: Identity ID missing. Keys found: ${Object.keys(user).join(', ')}`);
      return;
    }
    navigate(`/admin/users/${userId}`);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.advancedRoleName && u.advancedRoleName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Users className="text-brand-indigo w-10 h-10" /> Global Directory
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Manage user identities and track security anomalies.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={() => setIsModalOpen(true)} className="btn-primary w-full md:w-auto flex items-center justify-center gap-2">
            <UserPlus size={18} /> Provision User
          </button>
        </div>
      </div>

      <div className="glass-card p-6 border-t-4 border-brand-indigo">
         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
           <h3 className="text-xl font-bold text-white flex items-center gap-2">
             <Activity className="text-brand-indigo" /> User Activity & Identity Registry
           </h3>
           <div className="relative w-full sm:w-64">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
             <input 
               type="text" 
               placeholder="Search directory..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-indigo transition-all"
             />
           </div>
         </div>

         {loading ? (
             <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-brand-indigo border-t-transparent rounded-full animate-spin"></div></div>
         ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 text-sm font-bold text-slate-400 border-b border-white/10 uppercase bg-white/5 rounded-tl-xl">Identity</th>
                    <th className="p-4 text-sm font-bold text-slate-400 border-b border-white/10 uppercase bg-white/5">Assigned Role</th>
                    <th className="p-4 text-sm font-bold text-slate-400 border-b border-white/10 uppercase bg-white/5">Operations Count</th>
                    <th className="p-4 text-sm font-bold text-slate-400 border-b border-white/10 uppercase bg-white/5">Last Authentication</th>
                    <th className="p-4 text-sm font-bold text-slate-400 border-b border-white/10 uppercase bg-white/5 rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan="5" className="text-center p-8 text-slate-500">No identities found.</td></tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg ${
                              user.isOnline ? 'bg-gradient-to-tr from-emerald-500 to-emerald-400 ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-surface-900' : 'bg-gradient-to-tr from-brand-indigo to-brand-violet'
                            }`}>
                              {user.name.charAt(0)}
                            </div>
                            {user.isOnline && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-surface-900 rounded-full animate-pulse flex items-center justify-center"></div>}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-brand-indigo transition-colors flex items-center gap-2">
                              {user.name} {user.isOnline && <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Online</span>}
                            </p>
                            <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={10}/> {user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                         <span className="px-3 py-1 bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20 rounded-full text-xs font-bold whitespace-nowrap">
                           {user.advancedRoleName || 'Unassigned'}
                         </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-slate-300 text-sm font-mono font-medium">
                          <Activity size={14} className="text-emerald-500" /> {user.actionsTaken} events
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-slate-300 text-sm font-medium flex items-center gap-1">
                             <LogIn size={14} className="text-brand-violet" />
                             {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-slate-500">{new Date(user.lastLogin).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                         <div className="flex items-center gap-2">
                           <button 
                             onClick={() => handleViewActivity(user)}
                             className="px-3 py-1.5 bg-brand-indigo/10 hover:bg-brand-indigo/20 rounded-lg text-brand-indigo text-xs font-bold transition-colors flex items-center gap-1"
                           >
                             <Eye size={14} /> View Activity
                           </button>
                           <button 
                             onClick={() => handleDeleteUser(user.id)}
                             className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 hover:text-red-400 transition-colors" 
                             title="Terminate Account"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-8 rounded-3xl w-full max-w-md relative z-10 border border-white/10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <UserPlus className="text-brand-indigo" /> Provision Identity
              </h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input type="text" className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-indigo" required value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})} placeholder="e.g. Satoshi Nakamoto" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input type="email" className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-indigo" required value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})} placeholder="satoshi@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Secure Password</label>
                  <input type="password" className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-indigo" required value={newUser.password} onChange={e=>setNewUser({...newUser, password: e.target.value})} placeholder="••••••••" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Initial Role (Optional)</label>
                  <select 
                    className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-indigo appearance-none"
                    value={newUser.role_id} 
                    onChange={e=>setNewUser({...newUser, role_id: e.target.value})}
                  >
                    <option value="" disabled className="bg-slate-900">Select Role...</option>
                    {roles.map(r => <option key={r.id} value={r.id} className="bg-slate-900">{r.name}</option>)}
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-colors">Cancel</button>
                   <button type="submit" className="flex-1 btn-primary py-3">Provision</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}


      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
