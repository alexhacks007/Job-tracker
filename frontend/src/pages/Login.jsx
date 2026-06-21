import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import logo from '../zenbyte_logo.png';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        login(data.token, data.user);
        toast.success('Welcome back!');
        navigate('/');
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-8 rounded-2xl shadow-xl"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="ZenByte Logo" className="w-16 h-16 object-contain rounded-2xl shadow-lg border border-white/10" />
          </div>
          <h2 className="text-3xl font-black tracking-tight flex items-center justify-center gap-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">ZenByte</span>
            <span className="text-slate-800 dark:text-white font-medium">Job Tracker</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/30"
          >
            Sign In
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 dark:text-gray-400 text-sm">
          Don't have an account? <Link to="/register" className="text-blue-500 hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
