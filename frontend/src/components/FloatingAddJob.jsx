import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Briefcase, X } from 'lucide-react';
import JobFormModal from './JobFormModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FloatingAddJob = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuth();

  const handleSaveJob = async (jobData) => {
    try {
      const res = await fetch('/api/jobs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jobData)
      });

      if (res.ok) {
        toast.success('Job added successfully');
        setIsModalOpen(false);
        // We might want a global event or refresh logic here, 
        // but for now, simple toast is good.
        window.location.reload(); // Temporary measure to refresh data across pages
      } else {
        toast.error('Failed to save job');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  return (
    <>
      <div className="fixed bottom-8 right-8 z-40">
        <motion.button
          whileHover={{ scale: 1.05, shadow: '0 20px 25px -5px rgb(99 102 241 / 0.4)' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 bg-gradient-to-br from-brand-indigo to-brand-violet text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-indigo/30 transition-shadow group"
        >
          <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
        </motion.button>
        
        {/* Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 hidden md:block">
           <div className="glass px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
              Quick Add Job
           </div>
        </div>
      </div>

      <JobFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveJob} 
      />
    </>
  );
};

export default FloatingAddJob;
