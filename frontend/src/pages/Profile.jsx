import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save, ShieldCheck, Briefcase, Camera, Link2, Globe, ChevronRight, Zap, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const InputField = ({ label, icon: Icon, id, ...props }) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
      {label}
    </label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-500 group-focus-within:text-brand-indigo transition-colors">
        <Icon size={16} />
      </div>
      <input
        id={id}
        className="w-full pl-12 pr-4 py-3.5 rounded-[1.5rem] border border-white/5 bg-white/5 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-brand-indigo/20 focus:border-brand-indigo/30 outline-none transition-all font-medium text-sm"
        {...props}
      />
    </div>
  </div>
);

const PlatformIcon = ({ platform, className = 'w-5 h-5' }) => {
  const icons = {
    linkedin: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
      </svg>
    ),
    naukri: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
    ),
    workindia: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-11-2h6v2H9V4zM4 19V8h16v11H4z"/>
      </svg>
    ),
    glassdoor: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.809 9.555H12.06V0h9.75v9.555zM2.191 9.555V0h9.75v9.555H2.191zm9.869 4.888H2.191V24h9.75v-9.557h.119zm9.75 0H12.06V24h9.75v-9.557z"/>
      </svg>
    ),
  };
  return icons[platform] || null;
};

const PLATFORMS = [
  { key: 'linkedin',  label: 'LinkedIn',   placeholder: '@username', color: 'text-brand-blue' },
  { key: 'naukri',   label: 'Naukri',     placeholder: 'Profile ID',  color: 'text-brand-indigo' },
  { key: 'workindia',label: 'WorkIndia',  placeholder: 'ID',             color: 'text-emerald-400' },
  { key: 'glassdoor',label: 'Glassdoor',  placeholder: 'Link',            color: 'text-brand-violet' },
];

const Profile = () => {
  const { user, token, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: '', email: '', role: '', created_at: '', avatar: '', linkedin: '', naukri: '', workindia: '', glassdoor: '', portfolio: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [jobCount, setJobCount] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profRes, jobsRes] = await Promise.all([
          fetch('/api/profile/', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/jobs/', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (profRes.ok) {
           const data = await profRes.json();
           setProfile(data);
           if (data.avatar) setAvatarPreview(data.avatar);
        }
        if (jobsRes.ok) setJobCount((await jobsRes.json()).length);
      } catch { toast.error('Sync failed'); }
    };
    fetchData();
  }, [token]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setAvatarPreview(base64);
      setAvatarLoading(true);
      try {
        await fetch('/api/profile/avatar/', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ avatar: base64 })
        });
        updateUser({ avatar: base64 });
        toast.success('Identity visual updated');
      } catch { toast.error('Avatar sync failed'); }
      finally { setAvatarLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await fetch('/api/profile/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        updateUser(profile);
        toast.success('Matrix profile synchronized');
      }
    } catch { toast.error('Sync failed'); }
    finally { setProfileLoading(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Keys do not match');
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/profile/password/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(passwords)
      });
      if (res.ok) {
        toast.success('Encryption keys updated');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else toast.error('Verification failed');
    } catch { toast.error('Sync failed'); }
    finally { setPasswordLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden glass rounded-[3.5rem] p-10 border border-white/5 bg-slate-900/40">
         <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <User size={180} className="text-brand-indigo" />
         </div>

         <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
               <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-brand-indigo to-brand-violet p-1 shadow-2xl shadow-brand-indigo/30 transition-transform group-hover:scale-105">
                  <div className="w-full h-full rounded-[2.3rem] overflow-hidden bg-slate-950 flex items-center justify-center">
                     {avatarPreview ? (
                       <img src={avatarPreview} className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-5xl font-black text-white">{profile.name?.charAt(0)}</span>
                     )}
                  </div>
               </div>
               <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl glass border border-white/10 flex items-center justify-center text-brand-indigo shadow-xl group-hover:bg-brand-indigo group-hover:text-white transition-all">
                  {avatarLoading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
               </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />

            <div className="text-center md:text-left flex-1 min-w-0">
               <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                  <span className="px-3 py-1 rounded-full bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo text-[10px] font-black uppercase tracking-widest">
                     {profile.role || 'Member'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                     <Zap size={10} className="text-emerald-400" /> Active Sync
                  </span>
               </div>
               <h1 className="text-4xl font-black text-white tracking-tight truncate">{profile.name}</h1>
               <p className="text-slate-400 font-medium mt-1 truncate">{profile.email}</p>
               
               <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Opportunities</span>
                     <span className="text-xl font-black text-white">{jobCount || '0'} Total</span>
                  </div>
                  <div className="w-px h-10 bg-white/5" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Network Score</span>
                     <span className="text-xl font-black text-white">Elite</span>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
         {/* Identity Matrix */}
         <div className="lg:col-span-3 space-y-10">
            <section className="glass rounded-[3rem] p-10 border border-white/5 space-y-8">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-indigo/10 flex items-center justify-center text-brand-indigo">
                     <User size={20} />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">Identity Matrix</h2>
               </div>

               <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <InputField id="name" label="Legal Name" icon={User} value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} />
                     <InputField id="email" label="Contact Route" icon={Mail} value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} />
                  </div>
                  <InputField id="portfolio" label="Digital Signature (Portfolio)" icon={Globe} value={profile.portfolio || ''} onChange={e => setProfile({...profile, portfolio: e.target.value})} />
                  
                  <button type="submit" disabled={profileLoading} className="btn-primary w-fit px-10 flex items-center gap-2">
                     <Save size={18} /> {profileLoading ? 'Syncing...' : 'Update Matrix'}
                  </button>
               </form>
            </section>

            <section className="glass rounded-[3rem] p-10 border border-white/5 space-y-8">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-violet/10 flex items-center justify-center text-brand-violet">
                     <Link2 size={20} />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">Platform Extensions</h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {PLATFORMS.map(p => (
                    <InputField key={p.key} id={p.key} label={p.label} icon={Link2} value={profile[p.key] || ''} onChange={e => setProfile({...profile, [p.key]: e.target.value})} />
                  ))}
               </div>
               
               <button onClick={handleProfileSave} disabled={profileLoading} className="btn-secondary w-full md:w-fit px-10">
                  Save Extensions
               </button>
            </section>
         </div>

         {/* Access Control */}
         <div className="lg:col-span-2 space-y-10">
            <section className="glass rounded-[3rem] p-10 border border-white/5 space-y-8">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                     <Lock size={20} />
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight">Encryption Keys</h2>
               </div>

               <form onSubmit={handlePasswordChange} className="space-y-6">
                  <InputField id="old-pass" label="Current Key" icon={Lock} type="password" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} />
                  <InputField id="new-pass" label="New Access Key" icon={Sparkles} type="password" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} />
                  <InputField id="confirm-pass" label="Verify New Key" icon={ShieldCheck} type="password" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} />
                  
                  <button type="submit" disabled={passwordLoading} className="btn-secondary w-full flex items-center justify-center gap-2 border-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10">
                     <ShieldCheck size={18} /> {passwordLoading ? 'Encrypting...' : 'Update Security'}
                  </button>
               </form>
            </section>

            <section className="glass rounded-[3rem] p-10 border border-red-500/10 bg-red-500/5 group">
                <h3 className="text-red-500 font-black uppercase text-[10px] tracking-widest mb-2">Danger Zone</h3>
                <h4 className="text-white font-bold text-lg">Terminate Identity</h4>
                <p className="text-red-500/60 text-xs mt-2 font-medium">Permanently purge all tracked jobs, companies, and matrix data from the cluster.</p>
                <button className="mt-6 w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                   Purge Data Segment
                </button>
            </section>
         </div>
      </div>
    </div>
  );
};

export default Profile;

