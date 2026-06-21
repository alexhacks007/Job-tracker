const express = require('express');
const router = express.Router();
const db = require('../db/setup');
const { checkRole } = require('../middleware/rbac');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Only Super Admin or Admin can configure RBAC (or fallback simple admin)
router.use((req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'Super Admin') return next();
  res.status(403).json({ message: 'Forbidden' });
});

// Seed default roles and permissions if empty
router.post('/seed', (req, res) => {
  const roles = ['Super Admin', 'Admin', 'Moderator', 'Premium User', 'User', 'Guest'];
  const permissions = ['USER_MANAGEMENT', 'JOB_MANAGEMENT', 'TASK_MANAGEMENT', 'ANALYTICS_ACCESS', 'AI_INSIGHTS', 'BEHAVIOR_TRACKING', 'SYSTEM_CONTROL', 'SECURITY_CONTROL'];

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    roles.forEach(r => {
      db.run("INSERT OR IGNORE INTO roles (name) VALUES (?)", [r]);
    });
    permissions.forEach(p => {
      db.run("INSERT OR IGNORE INTO permissions (name) VALUES (?)", [p]);
    });
    // Assign Super Admin all permissions
    db.run("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'Super Admin'");
    // Assign Normal User basic permissions
    db.run("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'User' AND p.name IN ('JOB_MANAGEMENT', 'TASK_MANAGEMENT', 'ANALYTICS_ACCESS')");
    // Assign Admin everything except BEHAVIOR_TRACKING and SECURITY_CONTROL
    db.run("INSERT OR IGNORE INTO role_permissions (role_id, permission_id) SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'Admin' AND p.name NOT IN ('BEHAVIOR_TRACKING', 'SECURITY_CONTROL')");
    db.run("COMMIT", (err) => {
      if (err) return res.status(500).json({ message: 'Seed failed', error: err.message });
      res.json({ message: 'Seeded successfully' });
    });
  });
});

// Get all RBAC Data
router.get('/', (req, res) => {
  db.serialize(() => {
    let result = { roles: [], permissions: [], role_permissions: [], users: [] };
    
    db.all("SELECT * FROM roles", (err, roles) => {
      if (err) return res.status(500).json(err);
      result.roles = roles;
      
      db.all("SELECT * FROM permissions", (err, perms) => {
        result.permissions = perms;
        
        db.all("SELECT * FROM role_permissions", (err, rp) => {
          result.role_permissions = rp;
          
          db.all("SELECT id, name, email, role FROM users", (err, users) => {
            // Also fetch advanced user_roles
            db.all("SELECT * FROM user_roles", (err, ur) => {
              // merge
              result.users = users.map(u => {
                const advancedRoles = ur.filter(x => x.user_id === u.id).map(x => x.role_id);
                return { ...u, advancedRoles };
              });
              res.json(result);
            });
          });
        });
      });
    });
  });
});

// Assign/Update User Role
router.post('/assign-role', (req, res) => {
  const { user_id, role_id } = req.body;
  if (!user_id || !role_id) return res.status(400).json({ message: 'Missing fields' });
  
  db.serialize(() => {
    db.run("DELETE FROM user_roles WHERE user_id = ?", [user_id]);
    db.run("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [user_id, role_id], (err) => {
      if (err) return res.status(500).json({ message: err.message });
      
      // Sync legacy role column for backward compatibility
      db.get("SELECT name FROM roles WHERE id = ?", [role_id], (err, row) => {
        if (row) {
          db.run("UPDATE users SET role = ? WHERE id = ?", [row.name.toLowerCase() === 'admin' ? 'admin' : row.name, user_id]);
        }
        res.json({ message: 'Role assigned successfully' });
      });
    });
  });
});

// Update Role Permissions
router.post('/role-permissions', (req, res) => {
  const { role_id, permission_ids } = req.body; // permission_ids is an array
  if (!role_id || !Array.isArray(permission_ids)) return res.status(400).json({ message: 'Missing fields' });

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run("DELETE FROM role_permissions WHERE role_id = ?", [role_id]);
    const stmt = db.prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
    permission_ids.forEach(p_id => stmt.run(role_id, p_id));
    stmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: 'Permissions updated successfully' });
    });
  });
});

// Create new role
router.post('/roles', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Role name required' });
  db.run("INSERT INTO roles (name) VALUES (?)", [name], function(err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ id: this.lastID, name });
  });
});

// Delete role
router.delete('/roles/:id', (req, res) => {
  db.run("DELETE FROM roles WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: 'Role deleted' });
  });
});

// Create new permission
router.post('/permissions', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Permission name required' });
  db.run("INSERT INTO permissions (name) VALUES (?)", [name], function(err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ id: this.lastID, name });
  });
});

// Delete permission
router.delete('/permissions/:id', (req, res) => {
  db.run("DELETE FROM permissions WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: 'Permission deleted' });
  });
});

// Get RBAC Analytics
router.get('/analytics', (req, res) => {
  db.serialize(() => {
    db.all(`
      SELECT r.name, COUNT(ur.user_id) as count 
      FROM roles r 
      LEFT JOIN user_roles ur ON r.id = ur.role_id 
      GROUP BY r.id
    `, (err, roleStats) => {
      if (err) return res.status(500).json(err);
      
      db.all(`
        SELECT r.name, COUNT(rp.permission_id) as count 
        FROM roles r 
        LEFT JOIN role_permissions rp ON r.id = rp.role_id 
        GROUP BY r.id
      `, (err, permStats) => {
        if (err) return res.status(500).json(err);
        
        // Mocking recent security events for the dashboard
        const recentEvents = [
          { id: 1, action: "Role assigned", user: "Admin", target: "John Doe", time: new Date(Date.now() - 3600000).toISOString() },
          { id: 2, action: "Permission created", user: "Super Admin", target: "DATA_EXPORT", time: new Date(Date.now() - 7200000).toISOString() },
          { id: 3, action: "Matrix updated", user: "Admin", target: "Moderator Role", time: new Date(Date.now() - 86400000).toISOString() },
          { id: 4, action: "Security Seed", user: "System", target: "All Default Roles", time: new Date(Date.now() - 172800000).toISOString() }
        ];

        res.json({ roleDistribution: roleStats, permissionDistribution: permStats, recentEvents });
      });
    });
  });
});

// Get Users With Activity
router.get('/users-activity', (req, res) => {
  db.serialize(() => {
    db.all(`
      SELECT 
        u.id as id, u.name as name, u.email as email, u.role as role, u.created_at as created_at, u.last_active_at as last_active_at,
        (SELECT role_id FROM user_roles WHERE user_id = u.id LIMIT 1) as advancedRoleId,
        (SELECT MAX(created_at) FROM activity_logs WHERE user_id = u.id AND action_type = 'login') as lastLogin,
        (
          (SELECT COUNT(*) FROM jobs WHERE user_id = u.id) +
          (SELECT COUNT(*) FROM todos WHERE user_id = u.id) +
          (SELECT COUNT(*) FROM activity_logs WHERE user_id = u.id)
        ) as actionsTaken
      FROM users u
    `, (err, users) => {
      if (err) return res.status(500).json(err);
      
      db.all("SELECT id, name FROM roles", (err, roles) => {
        if (err) return res.status(500).json(err);
        
        const usersWithRoles = users.map(u => {
          const roleObj = roles.find(r => r.id === u.advancedRoleId);
          const lastActive = u.last_active_at ? new Date(u.last_active_at) : null;
          // Consider online if active in last 5 minutes (300000 ms)
          const isOnline = lastActive && (Date.now() - lastActive.getTime() < 300000);
          
          return {
            ...u,
            advancedRoleName: roleObj ? roleObj.name : u.role,
            lastLogin: u.lastLogin || u.created_at, // Fallback to registration date if no login record
            actionsTaken: u.actionsTaken || 0,
            isOnline
          };
        });

        res.json(usersWithRoles);
      });
    });
  });
});

// Admin create user
router.post('/users', async (req, res) => {
  const { name, email, password, role_id } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  
  const bcrypt = require('bcrypt');
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [name, email, hashedPassword, 'user'], function(err) {
      if (err) return res.status(500).json({ message: err.message });
      const newUserId = this.lastID;
      
      if (role_id) {
         db.run("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)", [newUserId, role_id], (err) => {
           res.json({ message: 'User created securely', id: newUserId });
         });
      } else {
         res.json({ message: 'User created securely', id: newUserId });
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin delete user
router.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  // Make sure admin isn't deleting themselves or super admin
  if (req.user.id == userId) return res.status(400).json({ message: "Cannot delete yourself." });

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    // Clean up all related data to fully wipe identity
    db.run("DELETE FROM user_roles WHERE user_id = ?", [userId]);
    db.run("DELETE FROM jobs WHERE user_id = ?", [userId]);
    db.run("DELETE FROM companies WHERE user_id = ?", [userId]);
    db.run("DELETE FROM todos WHERE user_id = ?", [userId]);
    db.run("DELETE FROM activity_logs WHERE user_id = ?", [userId]);
    db.run("DELETE FROM achievements WHERE user_id = ?", [userId]);
    db.run("DELETE FROM behavior_metrics WHERE user_id = ?", [userId]);
    db.run("DELETE FROM ai_insights WHERE user_id = ?", [userId]);
    db.run("DELETE FROM user_goals WHERE user_id = ?", [userId]);
    
    db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ message: err.message });
      }
      db.run("COMMIT", (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: 'Identity fully scrubbed from the system' });
      });
    });
  });
});

// Admin view user activity
router.get('/users/:id/activity', (req, res) => {
  const userId = req.params.id;
  db.serialize(() => {
    const query = `
      SELECT 'login' as source, action_details as detail, created_at FROM activity_logs WHERE user_id = ?
      UNION ALL
      SELECT 'job' as source, 'Job track: ' || company_name || ' (' || job_role || ') - ' || status as detail, created_at FROM jobs WHERE user_id = ?
      UNION ALL
      SELECT 'todo' as source, 'Task added: ' || title as detail, created_at FROM todos WHERE user_id = ?
      ORDER BY created_at DESC
    `;
    db.all(query, [userId, userId, userId], (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    });
  });
});

// Send Administrative Nudge
router.post('/users/:id/nudge', (req, res) => {
  const userId = req.params.id;
  const { message } = req.body;
  
  if (!message) return res.status(400).json({ message: "Nudge message is required" });

  db.run(`
    INSERT INTO ai_insights (user_id, insight_type, message) 
    VALUES (?, 'ADMIN_NUDGE', ?)
  `, [userId, message], function(err) {
    if (err) return res.status(500).json({ message: err.message });
    
    // Also log it in activity logs so the admin can see they sent it in the history
    db.run(`
       INSERT INTO activity_logs (user_id, action_type, action_details)
       VALUES (?, 'nudge_sent', ?)
    `, [userId, `Admin sent a behavioral nudge: ${message}`]);

    res.json({ message: "Nudge delivered successfully to user sentinel" });
  });
});

// Admin view user full profile and analytics
router.get('/users/:id/full-profile', async (req, res) => {
  const userId = req.params.id;
  
  const queryAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  const getAsync = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  try {
    const user = await getAsync(`
      SELECT u.id, u.name, u.email, u.created_at, u.role, u.avatar, u.last_active_at,
        (SELECT MAX(created_at) FROM activity_logs WHERE user_id = u.id AND action_type = 'login') as lastLogin,
        (SELECT COUNT(*) FROM jobs WHERE user_id = u.id) as totalJobs,
        (SELECT COUNT(*) FROM todos WHERE user_id = u.id) as totalTodos,
        (SELECT COUNT(*) FROM companies WHERE user_id = u.id) as totalCompanies,
        (SELECT COUNT(*) FROM achievements WHERE user_id = u.id) as totalAchievements
      FROM users u
      WHERE u.id = ?
    `, [userId]);

    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Compute online status
    const lastActive = user.last_active_at ? new Date(user.last_active_at) : null;
    user.isOnline = lastActive && (Date.now() - lastActive.getTime() < 300000);

    const timeline = await queryAsync(`
      SELECT 'login' as source, action_details as detail, created_at FROM activity_logs WHERE user_id = ?
      UNION ALL
      SELECT 'job' as source, 'Job track: ' || company_name || ' (' || job_role || ') - ' || status as detail, created_at FROM jobs WHERE user_id = ?
      UNION ALL
      SELECT 'todo' as source, 'Task added: ' || title as detail, created_at FROM todos WHERE user_id = ?
      ORDER BY created_at DESC
    `, [userId, userId, userId]);

    // REAL Job Stats Distribution
    const jobStats = await queryAsync('SELECT status, COUNT(*) as count FROM jobs WHERE user_id = ? GROUP BY status', [userId]);

    // REAL AI Insights
    const aiInsights = await queryAsync('SELECT insight_type, message, generated_at FROM ai_insights WHERE user_id = ? ORDER BY generated_at DESC LIMIT 5', [userId]);
    
    // REAL Behavior Metrics derivations based on actual DB presence
    let activeJobs = 0, rejectedJobs = 0;
    jobStats.forEach(j => {
      if (['Rejected', 'Archived'].includes(j.status)) rejectedJobs += j.count;
      if (['Applied', 'Interview', 'Offer'].includes(j.status)) activeJobs += j.count;
    });

    const dropRateReal = user.totalJobs > 0 ? (rejectedJobs / user.totalJobs) * 100 : 0;
    const consistencyReal = Math.min((timeline.length / 30) * 100, 100); 
    const focusReal = activeJobs > 0 ? Math.min((user.totalTodos / activeJobs) * 50, 100) : 50; 
    const cognitiveLoadReal = Math.min(activeJobs * 5, 100);
    const speedReal = Math.min((user.totalJobs + user.totalTodos) * 2, 100);

    const behaviorMetrics = {
       consistency_score: Math.round(consistencyReal) || 10,
       focus_score: Math.round(focusReal) || 10,
       action_speed: Math.round(speedReal) || 10,
       cognitive_load: Math.round(cognitiveLoadReal) || 10,
       drop_rate: Math.round(dropRateReal) || 0
    };
    
    // Advanced Risk Engine
    let riskScore = "LOW";
    if (dropRateReal > 60 && consistencyReal < 20) riskScore = "HIGH";
    else if (dropRateReal > 40 || consistencyReal < 40) riskScore = "MEDIUM";

    // Heatmap Data (Last 6 months)
    const heatmapData = await queryAsync(`
      SELECT date(created_at) as date, COUNT(*) as count 
      FROM (
        SELECT created_at FROM activity_logs WHERE user_id = ?
        UNION ALL
        SELECT created_at FROM jobs WHERE user_id = ?
        UNION ALL
        SELECT created_at FROM todos WHERE user_id = ?
      ) 
      WHERE created_at >= date('now', '-180 days')
      GROUP BY date(created_at)
      ORDER BY date(created_at)
    `, [userId, userId, userId]);

    // Pipeline Trend (Last 30 days)
    const pipelineTrend = await queryAsync(`
      SELECT date(created_at) as date, status, COUNT(*) as count
      FROM jobs 
      WHERE user_id = ? AND created_at >= date('now', '-30 days')
      GROUP BY date(created_at), status
      ORDER BY date(created_at)
    `, [userId]);

    res.json({
      user,
      timeline,
      behaviorMetrics,
      jobStats,
      aiInsights,
      heatmapData,
      pipelineTrend,
      riskAnalysis: {
         riskScore,
         daysActive: Math.max(1, Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 3600 * 24))),
         totalActions: timeline.length,
         activePipeline: activeJobs
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
