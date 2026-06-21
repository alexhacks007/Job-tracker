const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // parse json request body (large for base64 avatars)

// Import routes (will be created in next steps)
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const dashboardRoutes = require('./routes/dashboard');
const profileRoutes = require('./routes/profile');
const companyRoutes = require('./routes/companies');
const todoRoutes = require('./routes/todos');
const insightsRoutes = require('./routes/insights');
const analyticsRoutes = require('./routes/analytics');
const achievementsRoutes = require('./routes/achievements');
const rbacRoutes = require('./routes/rbac');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/rbac', rbacRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Job Tracker Pro API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
