import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldAlert, Check, Users, Key, Activity, Plus, Trash2, ShieldCheck, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const AdminRBAC = () => {
  const { token, user } = useAuth();
  const [data, setData] = useState({ roles: [], permissions: [], role_permissions: [], users: [] });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matrix'); // matrix, analytics, users, settings
  const [newRole, setNewRole] = useState('');
  const [newPerm, setNewPerm] = useState('');

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rbacRes, analyticsRes] = await Promise.all([
        fetch('/api/rbac/', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/rbac/analytics/', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (rbacRes.ok && analyticsRes.ok) {
        setData(await rbacRes.json());
        setAnalytics(await analyticsRes.json());
      } else {
        toast.error('Failed to load RBAC data');
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

  const handleSeed = async () => {
    try {
      const res = await fetch('/api/rbac/seed/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Database seeded, refreshing...');
        fetchData();
      }
    } catch (err) {
      toast.error('Error seeding DB');
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    try {
      const res = await fetch('/api/rbac/assign-role/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: userId, role_id: roleId })
      });
      if (res.ok) {
        toast.success('Role updated');
        fetchData();
      } else {
        toast.error('Could not update role');
      }
    } catch (err) {
      toast.error('Server Error');
    }
  };

  const togglePermission = async (roleId, permissionId, currentPerms) => {
    const permExists = currentPerms.some(rp => rp.role_id === roleId && rp.permission_id === permissionId);
    let newPerms = [];
    if (permExists) {
      newPerms = currentPerms.filter(rp => rp.role_id === roleId).map(rp => rp.permission_id).filter(id => id !== permissionId);
    } else {
      newPerms = currentPerms.filter(rp => rp.role_id === roleId).map(rp => rp.permission_id);
      newPerms.push(permissionId);
    }

    try {
      const res = await fetch('/api/rbac/role-permissions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role_id: roleId, permission_ids: newPerms })
      });
      if (res.ok) {
        toast.success('Permissions updated');
        fetchData();
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRole.trim()) return;
    try {
      const res = await fetch('/api/rbac/roles/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newRole })
      });
      if (res.ok) {
        toast.success('Role Created');
        setNewRole('');
        fetchData();
      }
    } catch (err) { toast.error('Error creating role'); }
  };

  const handleCreatePerm = async (e) => {
    e.preventDefault();
    if (!newPerm.trim()) return;
    try {
        const res = await fetch('/api/rbac/permissions/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: newPerm })
        });
        if (res.ok) {
          toast.success('Permission Created');
          setNewPerm('');
          fetchData();
        }
      } catch (err) { toast.error('Error creating permission'); }
  };

  if (loading || !analytics) return (
    <div className="flex items-center justify-center p-12 text-slate-400">
      <div className="w-12 h-12 border-4 border-brand-indigo border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="text-brand-indigo w-10 h-10" /> Security Hub
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Advanced Role-Based Access Control & Analytics</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleSeed} className="btn-secondary flex items-center gap-2">
            <Database size={18} /> Seed Default Policies
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner overflow-x-auto w-max">
        {[
          { id: 'matrix', label: 'Policy Matrix', icon: Shield },
          { id: 'analytics', label: 'Threat Analytics', icon: Activity },
          { id: 'users', label: 'User Provisioning', icon: Users },
          { id: 'settings', label: 'Security Objects', icon: Key }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-brand-indigo text-white shadow-lg shadow-brand-indigo/20 scale-[1.02]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-brand-indigo">
                <div className="p-3 rounded-full bg-brand-indigo/20 text-brand-indigo"><Users size={24}/></div>
                <div><h3 className="text-2xl font-bold text-white">{data.users.length}</h3><p className="text-slate-400 text-sm">Managed Identities</p></div>
              </div>
              <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-emerald-500">
                <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-500"><ShieldCheck size={24}/></div>
                <div><h3 className="text-2xl font-bold text-white">{data.roles.length}</h3><p className="text-slate-400 text-sm">Active Roles</p></div>
              </div>
              <div className="glass-card p-6 flex items-center gap-4 border-l-4 border-orange-500">
                <div className="p-3 rounded-full bg-orange-500/20 text-orange-500"><Key size={24}/></div>
                <div><h3 className="text-2xl font-bold text-white">{data.permissions.length}</h3><p className="text-slate-400 text-sm">Granular Policies</p></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-6">Identity Distribution by Role</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics.roleDistribution} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="count" nameKey="name" stroke="none">
                        {analytics.roleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-4 mt-4 justify-center">
                    {analytics.roleDistribution.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                        {s.name} ({s.count})
                    </div>
                    ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-6">Permission Density per Role</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.permissionDistribution} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                      <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24}>
                        {analytics.permissionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index+1) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-3xl rounded-full -z-10" />
               <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><Activity className="text-red-400" /> Recent Security Events</h3>
               <div className="space-y-3">
                 {analytics.recentEvents?.map(ev => (
                   <div key={ev.id} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                     <div>
                       <p className="text-sm font-bold text-white">{ev.action}</p>
                       <p className="text-xs text-slate-400">Target: <span className="text-slate-300">{ev.target}</span></p>
                     </div>
                     <div className="text-right">
                       <p className="text-xs text-brand-indigo font-medium">{ev.user}</p>
                       <p className="text-xs text-slate-500">{new Date(ev.time).toLocaleTimeString()}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'matrix' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="glass-card p-6 overflow-x-auto">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <Shield className="text-emerald-500" /> Authorization Matrix
              </h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 text-sm font-bold text-slate-400 border-b border-white/10 uppercase bg-white/5 rounded-tl-xl">Permission Scope</th>
                    {data.roles.map((role, idx) => (
                      <th key={role.id} className={`p-4 text-sm font-bold text-center text-slate-300 border-b border-white/10 bg-white/5 ${idx === data.roles.length-1 ? 'rounded-tr-xl':''}`}>
                        {role.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.permissions.map(perm => (
                    <tr key={perm.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-4 text-xs font-mono font-bold text-brand-indigo group-hover:text-brand-violet transition-colors">
                        {perm.name}
                      </td>
                      {data.roles.map(role => {
                        const hasPerm = data.role_permissions.some(rp => rp.role_id === role.id && rp.permission_id === perm.id);
                        return (
                          <td key={role.id} className="p-4 text-center">
                            <button 
                              onClick={() => togglePermission(role.id, perm.id, data.role_permissions)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center mx-auto transition-all duration-300 ${hasPerm ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110' : 'bg-white/5 text-transparent hover:bg-white/20 hover:scale-105'}`}
                            >
                              <Check size={16} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
             <div className="glass-card p-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                <Users className="text-brand-violet" /> Identity Provisioning
              </h3>
              <div className="space-y-3">
                {data.users.map(u => (
                  <div key={u.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-indigo to-brand-violet flex items-center justify-center text-white font-bold">{u.name.charAt(0)}</div>
                      <div>
                        <p className="text-white font-bold">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 bg-black/40 rounded-xl p-1 border border-white/10">
                      <select
                        className="bg-transparent text-sm font-bold text-emerald-400 border-0 outline-none p-2 cursor-pointer focus:ring-0"
                        value={u.advancedRoles[0] || ''}
                        onChange={(e) => handleAssignRole(u.id, e.target.value)}
                      >
                        <option value="" disabled className="bg-slate-900">Assign Role</option>
                        {data.roles.map(r => (
                          <option key={r.id} value={r.id} className="bg-slate-900 text-white">{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="glass-card p-6 border-t-4 border-brand-indigo">
               <h3 className="text-xl font-bold text-white mb-6">Role Management</h3>
               <form onSubmit={handleCreateRole} className="flex gap-2 mb-6">
                  <input type="text" placeholder="e.g. Content Creator" className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-transparent transition-all" value={newRole} onChange={(e)=>setNewRole(e.target.value)} />
                  <button type="submit" className="btn-primary p-3"><Plus size={20}/></button>
               </form>
               <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                 {data.roles.map(r => (
                   <div key={r.id} className="flex justify-between p-3.5 bg-slate-800/40 hover:bg-slate-800/60 transition-colors border border-slate-700/30 rounded-xl text-sm font-bold text-slate-200">
                     <span>{r.name}</span>
                   </div>
                 ))}
               </div>
             </div>

             <div className="glass-card p-6 border-t-4 border-orange-500">
               <h3 className="text-xl font-bold text-white mb-6">Policy Generation</h3>
               <form onSubmit={handleCreatePerm} className="flex gap-2 mb-6">
                  <input type="text" placeholder="e.g. CAN_EDIT_POSTS" className="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2 text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" value={newPerm} onChange={(e)=>setNewPerm(e.target.value.toUpperCase().replace(/\s+/g,'_'))} />
                  <button type="submit" className="btn-primary p-3 !bg-orange-500 hover:!bg-orange-600 !shadow-orange-500/20"><Plus size={20}/></button>
               </form>
               <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                 {data.permissions.map(p => (
                   <div key={p.id} className="flex justify-between p-3.5 bg-slate-800/40 hover:bg-slate-800/60 transition-colors border border-slate-700/30 rounded-xl text-xs font-mono font-bold text-slate-300">
                     <span>{p.name}</span>
                   </div>
                 ))}
               </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminRBAC;
