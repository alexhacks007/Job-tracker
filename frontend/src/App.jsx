import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Login from './pages/Login';
import Register from './pages/Register';
import CalendarView from './pages/CalendarView';
import Profile from './pages/Profile';
import Companies from './pages/Companies';
import JobDetail from './pages/JobDetail';
import Todos from './pages/Todos';
import JobDiscovery from './pages/JobDiscovery';
import AdminRBAC from './pages/AdminRBAC';
import AdminUsers from './pages/AdminUsers';
import AdminUserDetail from './pages/AdminUserDetail';
import EmailCampaigns from './pages/EmailCampaigns';

// Components
import Navbar from './components/Navbar';
import FloatingAddJob from './components/FloatingAddJob';

const ProtectedRoute = ({ children, requiredPerm }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-indigo/30 border-t-brand-indigo rounded-full animate-spin"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;

  if (requiredPerm && user.permissions) {
      if (!user.permissions.includes('ALL') && !user.permissions.includes(requiredPerm)) {
          return (
             <div className="min-h-screen flex items-center justify-center text-center p-8">
               <div className="glass-card p-8 border-t-4 border-red-500">
                  <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
                  <p className="text-slate-400">You do not have the required <span className="text-brand-indigo font-mono text-sm px-2 py-1 bg-white/5 rounded">{requiredPerm}</span> permission to view this page.</p>
               </div>
             </div>
          );
      }
  }

  return children;
};

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="w-full"
  >
    {children}
  </motion.div>
);

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface-950 font-sans selection:bg-brand-indigo/30 selection:text-white pb-24 lg:pb-0">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 pt-24 relative">
        <AnimatePresence mode="wait">
          <PageWrapper key={window.location.pathname}>
            {children}
          </PageWrapper>
        </AnimatePresence>
      </main>
      <FloatingAddJob />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/" element={
          <ProtectedRoute requiredPerm="ANALYTICS_ACCESS">
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/jobs" element={
           <ProtectedRoute requiredPerm="JOB_MANAGEMENT">
             <Layout>
               <Jobs />
             </Layout>
           </ProtectedRoute>
        } />
        
        <Route path="/calendar" element={
           <ProtectedRoute requiredPerm="TASK_MANAGEMENT"><Layout><CalendarView /></Layout></ProtectedRoute>
        } />

        <Route path="/profile" element={
           <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>
        } />

        <Route path="/companies" element={
           <ProtectedRoute requiredPerm="JOB_MANAGEMENT"><Layout><Companies /></Layout></ProtectedRoute>
        } />

        <Route path="/jobs/:id" element={
           <ProtectedRoute requiredPerm="JOB_MANAGEMENT"><Layout><JobDetail /></Layout></ProtectedRoute>
        } />

        <Route path="/todos" element={
           <ProtectedRoute requiredPerm="TASK_MANAGEMENT"><Layout><Todos /></Layout></ProtectedRoute>
        } />

        <Route path="/discover" element={
           <ProtectedRoute requiredPerm="JOB_MANAGEMENT"><Layout><JobDiscovery /></Layout></ProtectedRoute>
        } />

        <Route path="/admin/rbac" element={
           <ProtectedRoute requiredPerm="SYSTEM_CONTROL"><Layout><AdminRBAC /></Layout></ProtectedRoute>
        } />

        <Route path="/admin/users" element={
           <ProtectedRoute requiredPerm="USER_MANAGEMENT"><Layout><AdminUsers /></Layout></ProtectedRoute>
        } />

        <Route path="/admin/users/:id" element={
           <ProtectedRoute requiredPerm="USER_MANAGEMENT"><Layout><AdminUserDetail /></Layout></ProtectedRoute>
        } />

        <Route path="/campaigns" element={
           <ProtectedRoute requiredPerm="EMAIL_CAMPAIGNS"><Layout><EmailCampaigns /></Layout></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

